'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('decompany-app-properties');



/**
 * @description 오늘 (00:00) 현재까지 (최대 24:00) pageview, totalpage, totalpageviewsquare 갱신작업
 *  - STAT-PAGEVIEW-DAILY, STAT-PAGEVIEW-TOTALCOUNT-DAILY 갱신
 *  - 5분마다 동작
 * @function
 * @cron 
 */
module.exports.handler = async (event, context, callback) => {

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);
  const start = utils.getBlockchainTimestamp(now);
  const end = utils.getBlockchainTimestamp(tomorrow);

  console.log("query startDate", new Date(start), "~", new Date(end));
    
  const resultList = await aggregatePageview(start, end);
  console.log("Recently", new Date(start), "aggregatePageview Count", resultList?resultList.length:0);
  console.log("aggregatePageview resultList count", resultList.length);

  const totalpageview = await aggregatePageviewTotalCountForOnchainAndSave(start, end);
  console.log("aggregatePageviewTotalCountForOnchainAndSave Result", totalpageview);
  

  return "success";
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
        {n: {$gt: 1}
      }]
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
async function aggregatePageview(startTimestamp, endTimestamp){
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const queryPipeline = getQueryPipeline(startTimestamp, endTimestamp);

    const resultList = await wapper.aggregate(tables.TRACKING, queryPipeline);

    const bulk = wapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_DAILY);
    resultList.forEach((item, index)=>{
      item.created = Date.now();
      item.blockchainTimestamp = startTimestamp;
      item.blockchainDate = new Date(item.blockchainTimestamp);
         
      console.log("updateStatPageviewDaily bulk index", index, JSON.stringify(item));
      bulk.find({_id: item._id}).upsert().updateOne({$set: item});
    });
    console.log("bulk ops", bulk.tojson());
    const executeResults = await wapper.execute(bulk);
    console.log("executeResults", executeResults);

    return resultList;
  } catch(ex){
    console.log(ex);
    throw ex;
  } finally{
    wapper.close();
  }
  
}


async function aggregatePageviewTotalCountForOnchainAndSave(startTimestamp, endTimestamp){

  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const queryPipeline = [{
      $match: { 
        blockchainTimestamp: {$gte: startTimestamp, $lt: endTimestamp}
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
        "preserveNullAndEmptyArrays": true
      }
    }, {
      $match: {
        "RegistryAs": { "$exists": true, "$ne": null }
      }
    }, {
      $addFields: {
        blockNumber: "$RegistryAs.blockNumber"
      }
    }, {
      $lookup: {
        from: 'EVENT-BLOCK',
        localField: 'RegistryAs.blockNumber',
        foreignField: '_id',
        as: 'BlockAs'
      }
    }, {
      $unwind: {
        path: '$BlockAs',
        preserveNullAndEmptyArrays: true
      }
    }, {
      $addFields: {
        minus: {
          $subtract: ["$blockchainTimestamp", "$BlockAs.created"]
        },
        blockCreated: "$BlockAs.created",
        blockCreatedDate: "$BlockAs.createdDate"
      }
    }, {
      $match: {
        minus: {$gt: -86400000}
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
      
      item.blockchainTimestamp = startTimestamp;
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