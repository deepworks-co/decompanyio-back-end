'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('../../resources/config.js').APP_PROPERTIES();

const wapper = new MongoWapper(mongodb.endpoint);

/**
 * @description 전날 하루동안의 pageview를 집계 및 추가 작업
 *  - 전날 pageview 블록체인이 입력하기용 큐 발생
 *  - 전날 pageview 가 있는 문서의 voteAmount를 블록체인에서 읽어오기 큐 발생
 *  - 전날 totalpageview 를 mongodb에 저장
 * @function
 * @cron 
 */
module.exports.handler = async (event, context, callback) => {
  console.log(event);
  const now = new Date();
  //const yesterday = new Date(now - 1000 * 60 * 60 * 24);
  const yesterday = new Date(now - 1000 * 60 * 60 * 24 * 365);
  const blockchainTimestamp = utils.getBlockchainTimestamp(yesterday);
  const currentBlockchainTimestamp = utils.getBlockchainTimestamp(now);

  console.log("blockchainTimestamp", new Date(blockchainTimestamp), "~", new Date(currentBlockchainTimestamp));

  const totalPageviewResult = await aggregatePageviewTotalCount(blockchainTimestamp, currentBlockchainTimestamp);
    
  const resultList = await aggregatePageview(blockchainTimestamp, currentBlockchainTimestamp);
  console.log("Daily", new Date(blockchainTimestamp), "aggregatePageview Count", resultList?resultList.length:0);
  console.log("aggregatePageview resultList", JSON.stringify(resultList));

  const updateResult = await updateStatPageviewDaily(resultList);
  console.log("updateStatPageviewDaily Success", JSON.stringify(updateResult));
  
  const promises = [];
  /*
  resultList.forEach((item)=>{
    //console.log("put sqs", item);
    promises.push(sendMessagePageviewOnchain(blockchainTimestamp, item.documentId, item.pageview));
    promises.push(sendMessageReadVote(item.documentId));
    promises.push(sendMessageReadCreatorReward(item.documentId, blockchainTimestamp));
  })
  */
  const sqsResult = await Promise.all(promises);
  //console.log("SQS Send Result", sqsResult);
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
  //console.log("queryPipeline", queryPipeline);
  const resultList = await wapper.aggregate(tables.TRACKING, queryPipeline, {
    allowDiskUse: true
  });
  
  const bulk = wapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY);
  resultList.forEach((item, index)=>{
    const blockchainDate = new Date(Date.UTC(item._id.year, item._id.month-1, item._id.dayOfMonth));
    item.blockchainTimestamp = utils.getBlockchainTimestamp(blockchainDate);
    item.blockchainDate = blockchainDate;
    item.created = Date.now();
    bulk.find({_id: item._id}).upsert().replaceOne(item);
  });
  console.log("bulk ops", bulk.tojson());
  const bulkResult = await wapper.execute(bulk); 
  console.log(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY, "bulk result", JSON.stringify(bulkResult));
  return bulkResult;
}

/**
 * @description
 * @param  {} blockchainTimestamp
 * @param  {} endTimestamp
 */
async function aggregatePageview(blockchainTimestamp, endTimestamp){
    
  const queryPipeline = getQueryPipeline(blockchainTimestamp, endTimestamp);

  const resultList = await wapper.aggregate(tables.TRACKING, queryPipeline, {
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
  console.info("sendMessagePageviewOnchain", messageBody);
  const queueUrl = sqsConfig.queueUrls.PAGEVIEW_TO_ONCHAIN;
  
  return sqs.sendMessage(sqsConfig.region, queueUrl, messageBody);
}


/**
 * @param  {} blockchainTimestamp
 * @param  {} documentId
 * @param  {} confirmPageview
 */
function sendMessageReadVote(documentId){
  
  const messageBody = JSON.stringify({
    documentId: documentId
  });
  console.info("sendMessageReadVote", messageBody);
  const queueUrl = sqsConfig.queueUrls.LATEST_VOTE_READ_FROM_ONCHAIN;
  
  return sqs.sendMessage(sqsConfig.region, queueUrl, messageBody);
}

/**
 * @param  {} documentId
 * @param  {} blockchainTimestamp
 */
function sendMessageReadCreatorReward(documentId, blockchainTimestamp){
  
  const messageBody = JSON.stringify({
    documentId: documentId,
    blockchainTimestamp: blockchainTimestamp
  });
  console.info("sendMessageReadCreatorReward", messageBody);
  const queueUrl = sqsConfig.queueUrls.LATEST_CREATOR_REWARD_FROM_ONCHAIN;
  
  return sqs.sendMessage(sqsConfig.region, queueUrl, messageBody);
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
    const statDate = new Date(Date.UTC(item.year, item.month-1, item.dayOfMonth));
    item.created = Date.now();
    item.statDate = statDate;
    console.log("bulk index", index, JSON.stringify(item));
    bulk.find({_id: item._id}).upsert().replaceOne(item);
  });
  console.log("bulk ops", bulk.tojson());
  return await wapper.execute(bulk);
}