'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('../../resources/config.js').APP_PROPERTIES();

const TB_TRACKING = tables.TRACKING;
const TB_PAGEVIEW_TOTALCOUNT = tables.PAGEVIEW_TOTALCOUNT;

const wapper = new MongoWapper(mongodb.endpoint);

/**
 * @function
 * @cron 
 * @description 
 */
module.exports.handler = async (event, context, callback) => {
  const now = new Date();
  const yesterday = new Date(now - 1000 * 60 * 60 * 24);
  const blockchainTimestamp = utils.getBlockchainTimestamp(yesterday);
  const nowBT = utils.getBlockchainTimestamp(now);

  console.log("blockchainTimestamp",blockchainTimestamp, nowBT);


  const result = await aggregatePageviewTotalCount(blockchainTimestamp, nowBT);
  console.log("aggregatePageviewTotalCount", result);

  const promises = [];
  promises.push(sendMessagePageviewTotalCountOnchain(blockchainTimestamp, result.totalPageviewCount, result.totalPageviewSquare, result.count));

  const resultList = await aggregatePageview(blockchainTimestamp, nowBT);
  console.log("aggregatePageview", resultList)
  resultList.forEach((item)=>{
    //console.log("put sqs", item);
    promises.push(sendMessagePageviewOnchain(blockchainTimestamp, item.id, item.pageview));
  })

  const resultPromise = await Promise.all(promises);
  //console.log(resultPromise);
  return (null, "success");

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
      $and: [{t: {$gte: startTimestamp, $lt: endTimestamp}},
             {n: {$gt: 1}
            }]}
  }, {
    $group: {
      _id: {
        year: {$year: {$add: [new Date(0), "$t"]}}, 
        month: {$month: {$add: [new Date(0), "$t"]}}, 
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}},
        id: "$id",
        cid: "$cid",
        sid: "$sid"
      },
      count: {$sum: 1}
    }
  }, {
    $group: {
      _id: {
        year: "$_id.year", 
        month: "$_id.month", 
        dayOfMonth: "$_id.dayOfMonth",
        id: "$_id.id"
      },
      pageview: {$sum: "$count"},
    }
  }] 

  return queryPipeline;
}
/**
 * @param  {} blockchainTimestamp
 * @param  {} endTimestamp
 */
async function aggregatePageviewTotalCount(blockchainTimestamp, endTimestamp) {
  const queryPipeline = getQueryPipeline(blockchainTimestamp, endTimestamp)
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
  console.log("queryPipeline", queryPipeline);
  const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline, {
    allowDiskUse: true
  });
  
  const result = resultList[0]?resultList[0]:{totalPageviewSquare:0, totalPageview:0, count:0};
  const result2 = await wapper.save(TB_PAGEVIEW_TOTALCOUNT, {
    _id: Number(blockchainTimestamp),
    date: Number(blockchainTimestamp),
    totalViewCountSquare: result.totalPageviewSquare,
    totalViewCount: result.totalPageview,
    count: result.count,
    created: Date.now()
  });

  
  return result;
}

/**
 * @description
 * @param  {} blockchainTimestamp
 * @param  {} endTimestamp
 */
async function aggregatePageview(blockchainTimestamp, endTimestamp){
    
  const queryPipeline = getQueryPipeline(blockchainTimestamp, endTimestamp);

  const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline, {
    allowDiskUse: true
  });

  return resultList;
}

/**
 * @param  {} blockchainTimestamp
 * @param  {} documentId
 * @param  {} confirmPageview
 */
function sendMessagePageviewOnchain(blockchainTimestamp, documentId, confirmPageview){
  
  const messageBody = JSON.stringify({
    documentId: documentId,
    confirmPageview: confirmPageview,
    date: blockchainTimestamp
  });

  const queueUrl = sqsConfig.queueUrls.PAGEVIEW_TO_ONCHAIN;
  
  return sqs.sendMessage(sqsConfig.region, queueUrl, messageBody);
}
/**
 * @param  {} blockchainTimestamp
 * @param  {} totalViewCount
 * @param  {} totalViewCountSquare
 * @param  {} count
 */
function sendMessagePageviewTotalCountOnchain(blockchainTimestamp, totalViewCount, totalViewCountSquare, count){
  const messageBody = JSON.stringify({
    date: blockchainTimestamp,
    totalViewCount: totalViewCount,
    totalViewCountSquare: totalViewCountSquare,
    count
  });

  const queueUrl = sqsConfig.queueUrls.PAGEVIEWTOTALCOUNT_TO_ONCHAIN;
  return sqs.sendMessage(sqsConfig.region, queueUrl, messageBody);
}
