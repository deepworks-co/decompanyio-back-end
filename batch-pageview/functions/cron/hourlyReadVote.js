'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig} = require('../../resources/config.js').APP_PROPERTIES();

const TB_DOCUMENT = tables.DOCUMENT;

/**
 * @description 
 * 1시간마다 전체 문서의 VoteAmount를 가져오기 위한 SQS생성함
 * 
 */
module.exports.handler = async (event, context, callback) => {
  
  const wapper = new MongoWapper(mongodb.endpoint);
  const resultList = await wapper.findAll(TB_DOCUMENT, {state: "CONVERT_COMPLETE"});

  const promises = resultList.map((result)=>{
    return sendMessageReadVote(result._id);
  })

  await Promise.all(promises);

  console.log(promises);

  wapper.close();

 
  return (null, "success");
  
};

/**
 * @description 
 *  - documentId 문서의 최근 VoteAmount를 onchain에서 읽어올수 있는 SQS메세지를 발생시킨다.
 *  - readLatestVoteAmount function에서 해당 SQS 메세지를 받아 DOCUMENT-FEATURED에 저장한다.
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

