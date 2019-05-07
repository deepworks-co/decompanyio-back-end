'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('../../resources/config.js').APP_PROPERTIES();

const wapper = new MongoWapper(mongodb.endpoint);

/**
 * @description 오늘 (00:00) 현재까지 (최대 24:00) pageview 집계 및 추가 작업
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

  const totalPageviewResult = await aggregatePageviewTotalCountAndSave(start, end);
  console.log("aggregatePageviewTotalCount result", totalPageviewResult);
    
  const resultList = await aggregatePageview(start, end);
  console.log("Daily", new Date(start), "aggregatePageview Count", resultList?resultList.length:0);
  console.log("aggregatePageview resultList count", resultList.length);

  const updateResult = await updateStatPageviewDaily(resultList);
  console.log("updateStatPageviewRecently(Today) Success", JSON.stringify(updateResult));

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
 * @param  {} startTimestamp
 * @param  {} endTimestamp
 */
async function aggregatePageviewTotalCountAndSave(startTimestamp, endTimestamp) {
  const queryPipeline = getQueryPipeline(startTimestamp, endTimestamp)
  queryPipeline.push({
    $group: {
      _id: {
        year: "$_id.year", 
        month: "$_id.month", 
        dayOfMonth: "$_id.dayOfMonth",
      },
      totalPageviewSquare: {$sum: {$pow: ["$pageview", 2]}},
      totalPageview: {$sum: "$pageview"},
      count: {$sum: 1}
    }
  });
  //console.log("queryPipeline", queryPipeline);
  const resultList = await wapper.aggregate(tables.TRACKING, queryPipeline, {
    allowDiskUse: true
  });
  console.log("aggregatePageviewTotalCountAndSave", resultList);
  const bulk = wapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY);
  resultList.forEach((item, index)=>{
    
    item.blockchainTimestamp = Date.UTC(item._id.year, item._id.month-1, item._id.dayOfMonth);
    item.blockchainDate = new Date(item.blockchainTimestamp);
    item.created = Date.now();
    bulk.find({_id: item._id}).upsert().replaceOne(item);
  });
  
  return  await wapper.execute(bulk); 
}

/**
 * @description
 * @param  {} startTimestamp
 * @param  {} endTimestamp
 */
async function aggregatePageview(startTimestamp, endTimestamp){
    
  const queryPipeline = getQueryPipeline(startTimestamp, endTimestamp);

  const resultList = await wapper.aggregate(tables.TRACKING, queryPipeline, {
    allowDiskUse: true
  });

  return resultList;
}

/**
 * @param  {} resultList
 * [
 *   { _id: 
 *    { year: 2019,
 *      month: 2,
 *      dayOfMonth: 15,
 *      id: '49dac043231045829ccca088eadd1f85' },
 *   pageview: 1,
 *   year: 2019,
 *   month: 2,
 *   dayOfMonth: 15,
 *   documentId: '49dac043231045829ccca088eadd1f85',
 *   created: 1552620678519,
 *   statDate: 2019-02-15T00:00:00.000Z },
 *   ....
 * ]
 */
async function updateStatPageviewDaily(resultList){
  const bulk = wapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_DAILY);
  resultList.forEach((item, index)=>{
    item.created = Date.now();
    const blockchainDate = new Date(Date.UTC(item.year, item.month-1, item.dayOfMonth));
    item.blockchainDate = blockchainDate;
    item.blockchainTimestamp = utils.getBlockchainTimestamp(blockchainDate);    
    console.log("updateStatPageviewDaily bulk index", index, JSON.stringify(item));
    bulk.find({_id: item._id}).upsert().replaceOne(item);
  });
  console.log("bulk ops", bulk.tojson());
  return await wapper.execute(bulk);
}