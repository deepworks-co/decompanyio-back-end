'use strict';
const {utils, MongoWrapper} = require('decompany-common-utils');
const { mongodb, tables} = require('decompany-app-properties');


/**
 * @description 전날 하루동안의 pageview를 집계
 *  - STAT-PAGEVIEW-DAILY, STAT-PAGEVIEW-TOTALCOUNT-DAILY 갱신
 *  - 하루에 한번 UTC 00:50분에 동작 (Step function)
 * @function
 * @cron 
 */
module.exports.handler = async (event, context, callback) => {
  
  const {start, end} = event;

  const now = new Date();
  const startDate = new Date(now - 1000 * 60 * 60 * 24 * 1);
  
  let startTimestamp = utils.getBlockchainTimestamp(startDate);
  let endTimestamp = utils.getBlockchainTimestamp(now);

  if(start && end){
    console.log("input start, end", start, end);
    startTimestamp = start;
    endTimestamp = end;
  }

  console.log("aggregate pageview condition : startDate", new Date(startTimestamp), "~ endDate(exclude)", new Date(endTimestamp));
  
  const resultList = await aggregatePageviewAndSave(startTimestamp, endTimestamp);
  console.log("aggregatePageviewAndSave", startTimestamp, new Date(startTimestamp), "length", resultList?resultList.length:0);

  const pageviewTotalCountForOnchain = await aggregatePageviewTotalCountForOnchainAndSave(startTimestamp);
  console.log("aggregatePageviewTotalCountForOnchainAndSave", pageviewTotalCountForOnchain);

  return {
    count: resultList?resultList.length:0,
    blockchainTimestamp: startTimestamp,
    year: startDate.getUTCFullYear(),
    month: startDate.getUTCMonth() + 1,
    dayOfMonth: startDate.getUTCDate()
  };
}

/**
 * @description
 * 일정 (startTimestamp보다 크거나 같고 endTimestamp작은) 기간동안의 document id, cid, sid를 기준으로 pageview를 조회하기 위한 aggregate query pipeline 생성
 * DOCUMENT-TRACKING collection을 대상으로 한다.
 * @param  {} startTimestamp
 * @param  {} endTimestamp
 */
function getQueryPipeline(startTimestamp, endTimestamp){
  const queryPipeline = [{
    $match: {
      $and: [
        {t: {$gte: startTimestamp, $lt: endTimestamp}},
        {n: {$gt: 1}}, 
        {referer: {$ne: null}}
      ]
    }
  }, {
    $group: {
      '_id': {
        'year': {
          '$year': {
            '$add': [
              new Date(0), '$t'
            ]
          }
        }, 
        'month': {
          '$month': {
            '$add': [
              new Date(0), '$t'
            ]
          }
        }, 
        'dayOfMonth': {
          '$dayOfMonth': {
            '$add': [
              new Date(0), '$t'
            ]
          }
        }, 
        'id': '$id', 
        'cid': '$cid', 
        'sid': '$sid'
      }
    }
  }, {
    $group: {
      '_id': {
        'year': '$_id.year', 
        'month': '$_id.month', 
        'dayOfMonth': '$_id.dayOfMonth', 
        'id': '$_id.id'
      }, 
      'pageview': {
        '$sum': 1
      }
    }
  }, {
    $lookup: {
      'from': tables.DOCUMENT, 
      'foreignField': '_id', 
      'localField': '_id.id', 
      'as': 'document'
    }
  }, {
    $unwind: {
      'path': '$document'
    }
  }, {
    $match: {
      'document.isPublic': true, 
      'document.isDeleted': false, 
      'document.isBlocked': false
    }
  }, {
    $project: {
      documentId: "$_id.id",
      pageview: 1,
      isRegistry: 1
    }
  }] 

  return queryPipeline;
}

/**
 * @description
 * @param  {} startTimestamp
 * @param  {} endTimestamp
 */
async function aggregatePageviewAndSave(startTimestamp, endTimestamp){
  const wrapper = new MongoWrapper(mongodb.endpoint);
  try{
    const queryPipeline = getQueryPipeline(startTimestamp, endTimestamp);
    console.log("aggregatePageview queryPipeline", JSON.stringify(queryPipeline));

    const resultList = await wrapper.aggregate(tables.TRACKING, queryPipeline);

    const bulk = wrapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_DAILY);
    resultList.forEach((item)=>{
      item.created = Date.now();
      const {year, month, dayOfMonth} = item._id;
      const blockchainDate = new Date(Date.UTC(year, month-1, dayOfMonth));
      item.blockchainDate = blockchainDate;
      item.blockchainTimestamp = utils.getBlockchainTimestamp(blockchainDate);    
      bulk.find({_id: item._id}).upsert().updateOne({$set: item});
    });
    
    const executeResults = await wrapper.execute(bulk);
    console.log("daily aggregation pageview save result", executeResults);
    
    return resultList;

  } catch(ex){
    console.log(ex)
    throw ex
  } finally {
    wrapper.close();
  }
  
}



async function aggregatePageviewTotalCountForOnchainAndSave(blockchainTimestamp){

  const date = new Date(blockchainTimestamp);

  const wrapper = new MongoWrapper(mongodb.endpoint);
  try{
    const queryPipeline = [
      {
          $match: {"_id.year": date.getUTCFullYear(), "_id.month": date.getUTCMonth() + 1, "_id.dayOfMonth": date.getUTCDate()}
      },{
      $lookup: {
        'from': "DOCUMENT",
        'foreignField': '_id', 
        'localField': '_id.id', 
        'as': 'document'
      }
    }, {
      $unwind: {
        'path': '$document'
      }
    }, {
      $addFields: {
        'registryDate': {
          '$dateFromParts': {
            'year': {
              '$year': {
                '$add': [
                  new Date(0), '$document.registry.created'
                ]
              }
            }, 
            'month': {
              '$month': {
                '$add': [
                  new Date(0), '$document.registry.created'
                ]
              }
            }, 
            'day': {
              '$dayOfMonth': {
                '$add': [
                  new Date(0), '$document.registry.created'
                ]
              }
            }
          }
        }, 
        'statDate': {
          '$dateFromParts': {
            'year': '$_id.year', 
            'month': '$_id.month', 
            'day': '$_id.dayOfMonth'
          }
        }
      }
    }, {
      $addFields: {
        'isRegistry': {
          '$cond': [
            {
              '$and': [
                {
                  '$ne': [
                    '$registryDate', null
                  ]
                }, {
                  '$gte': [
                    '$statDate', '$registryDate'
                  ]
                }
              ]
            }, true, false
          ]
        }
      }
    }, {
      $match: {
        'document.isPublic': true, 
        'document.isDeleted': false, 
        'document.isBlocked': false
      }
    }, {
        $group: {
          _id: {year: "$_id.year", month: "$_id.month", dayOfMonth: "$_id.dayOfMonth"},
          totalPageview: {$sum: "$pageview"},
          totalPageviewSquare: {$sum: {$pow: ["$pageview", 2]}},
          count: {$sum: 1}
        }
      }
    ]
    console.log(tables.STAT_PAGEVIEW_DAILY, JSON.stringify(queryPipeline));
    const resultList = await wrapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
    console.log("resultList", resultList);

    const bulk = wrapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY);
    resultList.forEach((item, index)=>{
      
      item.blockchainTimestamp = blockchainTimestamp;
      item.blockchainDate = new Date(item.blockchainTimestamp);
      item.created = Date.now();
      bulk.find({_id: item._id}).upsert().updateOne(item);
    });
    console.log("aggregatePageviewTotalCountForOnchain bulk ops", bulk.tojson());
    const bulkResult = await wrapper.execute(bulk); 
    console.log("aggregatePageviewTotalCountForOnchain bulk result", tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY, JSON.stringify(bulkResult));
    return resultList
  } catch(err){
    console.log(err);
    throw err;
  } finally{
    wrapper.close();
  }
}