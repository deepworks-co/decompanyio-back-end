'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('../../resources/config.js').APP_PROPERTIES();

const TB_TRACKING = tables.TRACKING;
const TB_PAGEVIEW_TOTALCOUNT = tables.PAGEVIEW_TOTALCOUNT;

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
  const now = new Date();
  const yesterday = new Date(now - 1000 * 60 * 60 * 24);
  const blockchainTimestamp = utils.getBlockchainTimestamp(yesterday);
  const currentBlockchainTimestamp = utils.getBlockchainTimestamp(now);

  console.log("blockchainTimestamp", blockchainTimestamp, "~", currentBlockchainTimestamp);


  const result = await aggregatePageviewTotalCount(blockchainTimestamp, currentBlockchainTimestamp);
  console.log("aggregatePageviewTotalCount", result);

  const promises = [];
  const resultList = await aggregatePageview(blockchainTimestamp, currentBlockchainTimestamp);
  console.log("aggregatePageview Count", resultList?resultList.length:0);
  console.log("aggregatePageview", resultList)
  resultList.forEach((item)=>{
    //console.log("put sqs", item);
    promises.push(sendMessagePageviewOnchain(blockchainTimestamp, item.documentId, item.pageview));
    promises.push(sendMessageReadVote(item.documentId));
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
      documentId: {$first: "$_id.id"},
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
  console.log(result);

  const result2 = await wapper.save(TB_PAGEVIEW_TOTALCOUNT, {
    _id: Number(blockchainTimestamp),
    date: Number(blockchainTimestamp),
    totalViewCountSquare: result.totalPageviewSquare,
    totalViewCount: result.totalPageview,
    count: result.count,
    created: Date.now()
  });
  
  console.log(result2);
  
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