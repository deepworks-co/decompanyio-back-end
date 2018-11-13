'use strict';
const AWS = require('aws-sdk');
AWS.config.update({
  region: "us-west-1",
});

const TABLE_NAME = "DEV-CA-DOCUMENT";
const docClient = new AWS.DynamoDB.DocumentClient();

const contractUtil = require('../../commons/contract/contractWapper.js');
const utils = require('../../commons/utils.js');

/*
* curator에 대한 오늘 예상 수익금(Deck) Vote된 문서를 SQS로 전달 받음
* api/document/vote/{documentId}
*/
module.exports.handler = (event, context, callback) => {
  console.log("event.Records", event.Records.length, "records", event.Records);

  let promises = [];
  event.Records.forEach((record) => {

    const body = record.body;
    console.log("SQS message",  body);

    let params = null;

    if(typeof(body) ==  "string"){
      params = JSON.parse(body);
    } else {
      params = body;
    }

    const documentId = params.documentId;
    const accountId = params.accountId;
    const requestId = params.requestId;
    const blockchainTimestamp = utils.getBlockchainTimestamp(new Date()); //today
    const promise = processEstimateCuratorReward(accountId, documentId, blockchainTimestamp, requestId);

  });

  console.log("waitting promises", promises.length)
  Promise.all(promises).then((results) => {
    console.log("SUCCESS Curator Estimate Reward Results", results);
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: "done"
      })
    });
  }).catch((errs) => {
    console.error(errs);
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: errs
      })
    });
  });

};

function processEstimateCuratorReward(curatorId, documentId, viewCount, totalViewCount, requestId){
  //
  return new Promise((resolve, reject) => {
    contractUtil.calculateCuratorReward(curatorId, documentId, viewCount, totalViewCount).then((voteAmount) => {
      console.log("processCuratorReward", requestId, blockchainTimestamp, documentId, voteAmount);
      updateVoteAmount(curatorId, documentId, voteAmount).then((data) => {
        resolve({
          accountId: accountId,
          documentId: documentId,
          voteAmount: voteAmount,
          requestId: requestId,
          blockchainTimestamp: blockchainTimestamp
        });
      }).catch((err) => {
        reject(err);
      });
    }).catch((err) => {
      reject(err)
    });
  });
}

function updateVoteAmount(accountId, documentId, voteAmount) {
    // Increment an atomic counter
    /*
    const queryKey = {
        "accountId": accountId,
        "documentId": documentId
    }


    const params = {
        TableName:TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set voteAmount = :voteAmount",
        ExpressionAttributeValues:{
            ":voteAmount": utils.getNumber(voteAmount, 0)
        },
        //ConditionExpression: "attribute_not_exists(confirmViewCountHist.#date)",
        ReturnValues:"UPDATED_NEW"
    };

    return docClient.update(params).promise();
    */


}
