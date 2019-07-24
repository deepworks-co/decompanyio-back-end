'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('decompany-app-properties');


/**
 * @description 전날 하루동안의 pageview를 집계
 *  - STAT-PAGEVIEW-DAILY, STAT-PAGEVIEW-TOTALCOUNT-DAILY 갱신
 *  - 하루에 한번 UTC 00:50분에 동작 (Step function)
 * @function
 * @cron 
 */
module.exports.handler = async (event, context, callback) => {
  console.log(event);
  //const period = isNaN(event.period)?1:event.period;
  const now = new Date();
  const startDate = new Date(now - 1000 * 60 * 60 * 24 * 1);
  const startTimestamp = utils.getBlockchainTimestamp(startDate);
  const endTimestamp = utils.getBlockchainTimestamp(now);

  console.log("query startDate", new Date(startTimestamp), "~ endDate(exclude)", new Date(endTimestamp));
    
  const resultList = await aggregatePageviewAndSave(startTimestamp, endTimestamp);
  console.log("aggregatePageviewAndSave", startTimestamp, new Date(startTimestamp), "length", resultList?resultList.length:0);

  const pageviewTotalCountForOnchain = await aggregatePageviewTotalCountForOnchainAndSave(startTimestamp);
  console.log("aggregatePageviewTotalCountForOnchainAndSave", pageviewTotalCountForOnchain);

  return {remains: resultList?resultList.length:0};
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
    $sort: {
      t: 1
    }
  }, {
    $group: {
      _id: {
        year: {$year: {$add: [new Date(0), "$t"]}}, 
        month: {$month: {$add: [new Date(0), "$t"]}}, 
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}},
        id: "$id",
        cid: "$cid",
        sid: "$sid"
      }
    }
  }, {
    $lookup: {
      from: "DOCUMENT",
        foreignField: "_id",
        localField: "_id.id",
        as: "documentAs"
    }
  }, {
    $addFields: {
      "publicDoc": {
        "$arrayElemAt": [
            {
                "$filter": {
                    "input": "$documentAs",
                    "as": "doc",
                    "cond": {
                        $and: [
                          {"$eq": [ "$$doc.isPublic", true]},
                          {"$eq": [ "$$doc.isDeleted", false]},
                          {"$eq": [ "$$doc.isBlocked", false]},
                        ]
                    }
                }
            }, 0
        ]
      }
    }
  }, {
    $unwind: {
      path: "$publicDoc",
      preserveNullAndEmptyArrays: false
    }
  }, {
    $group: {
      _id: {
        year: "$_id.year", 
        month: "$_id.month", 
        dayOfMonth: "$_id.dayOfMonth",
        id: "$_id.id",
      },
      pageview: {$sum: 1},
    }
  }, {
    $addFields: {
      year:"$_id.year",
      month:"$_id.month",
      dayOfMonth:"$_id.dayOfMonth",
      documentId:"$_id.id",
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
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const queryPipeline = getQueryPipeline(startTimestamp, endTimestamp);
    console.log("aggregatePageview queryPipeline", JSON.stringify(queryPipeline));

    const resultList = await wapper.aggregate(tables.TRACKING, queryPipeline);

    const bulk = wapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_DAILY);
    resultList.forEach((item, index)=>{
      item.created = Date.now();
      const blockchainDate = new Date(Date.UTC(item.year, item.month-1, item.dayOfMonth));
      item.blockchainDate = blockchainDate;
      item.blockchainTimestamp = utils.getBlockchainTimestamp(blockchainDate);    
      console.log("updateStatPageviewDaily bulk index", index, JSON.stringify(item));
      bulk.find({_id: item._id}).upsert().updateOne({$set: item});
    });
    console.log("bulk ops", bulk.tojson());
    const executeResults = await wapper.execute(bulk);
    console.log("aggregatePageviewAndSave Result", executeResults);
    return resultList;

  } catch(ex){
    console.log(ex)
    throw e
  } finally {
    wapper.close();
  }
  
}



async function aggregatePageviewTotalCountForOnchainAndSave(blockchainTimestamp){

  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const queryPipeline = [{
      $match: { 
        blockchainTimestamp: blockchainTimestamp
      }
    }, {
      $lookup: {
        from: tables.EVENT_REGISTRY,
        localField: "documentId",
        foreignField: "documentId",
        as: "RegistryAs"
      }
    }, {
      $unwind: {
        path: "$RegistryAs",
        "preserveNullAndEmptyArrays": false
      }
    }, {
      $lookup: {
        from: tables.EVENT_BLOCK,
        localField: 'RegistryAs.blockNumber',
        foreignField: '_id',
        as: 'BlockAs'
      }
    }, {
      $unwind: {
        path: '$BlockAs',
        preserveNullAndEmptyArrays: false
      }
    }, {
      $group: {
        _id: {year: "$_id.year", month: "$_id.month", dayOfMonth: "$_id.dayOfMonth"},
        totalPageview: {$sum: "$pageview"},
        totalPageviewSquare: {$sum: {$pow: ["$pageview", 2]}},
        count: {$sum: 1}
      }
    }]
    console.log(tables.STAT_PAGEVIEW_DAILY, JSON.stringify(queryPipeline));
    const resultList = await wapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);


    const bulk = wapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY);
    resultList.forEach((item, index)=>{
      
      item.blockchainTimestamp = blockchainTimestamp;
      item.blockchainDate = new Date(item.blockchainTimestamp);
      item.created = Date.now();
      bulk.find({_id: item._id}).upsert().updateOne({$set: item});
    });
    console.log("aggregatePageviewTotalCountForOnchain bulk ops", bulk.tojson());
    const bulkResult = await wapper.execute(bulk); 
    console.log("aggregatePageviewTotalCountForOnchain bulk result", tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY, JSON.stringify(bulkResult));
    return resultList
  } catch(err){
    console.log(err);
    throw err;
  } finally{
    wapper.close();
  }
}