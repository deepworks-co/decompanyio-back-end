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
* registYesterdayViewCount
*/
module.exports.handler = (event, context, callback) => {
  console.log("event.Records", event.Records.length, "records", event.Records);

  let promises = [];
  for( const i in event.Records) {

    const body = event.Records[i].body;
    console.log("SQS message", i, body);

    let params = null;

    if(typeof(body) ==  "string"){
      params = JSON.parse(body);
    } else {
      params = body;
    }

    const documentId = params.documentId;
    const accountId = params.accountId;
    const requestId = params.requestId;
    const today = new Date(); /* 현재 */
    //const yesterday = today.setDate(yesterday.getDate() - 1);
    const blockchainTimestamp = params.date?params.date:utils.getBlockchainTimestamp(today);//today

    const promise = processCuratorReward(accountId, documentId, blockchainTimestamp, requestId);
    promises.push(promise);

  }


  console.log("waitting promises", promises.length)
  Promise.all(promises).then((results) => {
    console.log("SUCCESS Curator Confirm Reward Results", results);
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

function processCuratorReward(accountId, documentId, blockchainTimestamp, requestId){
  return new Promise((resolve, reject) => {
    contractUtil.getCuratorDepositOnDocument(documentId, blockchainTimestamp).then((voteAmount) => {
      console.log("processCuratorReward", requestId, blockchainTimestamp, documentId, voteAmount);
      updateVoteAmount(accountId, documentId, voteAmount, blockchainTimestamp).then((data) => {
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

function updateVoteAmount(accountId, documentId, voteAmount, blockchainTimestamp) {
    // Increment an atomic counter
    const queryKey = {
        "accountId": accountId,
        "documentId": documentId
    }

    const params = {
        TableName:TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set #confirmVoteAmount = :confirmVoteAmount",
        ExpressionAttributeNames: {
            "#confirmVoteAmount": "confirmVoteAmount"
        },
        ExpressionAttributeValues:{
            ":confirmVoteAmount": utils.getNumber(voteAmount, 0)
        },
        //ConditionExpression: "attribute_not_exists(confirmViewCountHist.#date)",
        ReturnValues:"UPDATED_NEW"
    };

    return docClient.update(params).promise();


}
