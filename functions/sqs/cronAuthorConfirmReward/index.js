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
  console.log("event", event.Records);
  console.log("event size", event.Records.length)
  let promises = [];
  for( const i in event.Records) {

    const body = event.Records[i];
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
    //console.log(accountId, documentId);
    const today = new Date();

    //const yesterday = today.setDate(today.getDate() - 1);

    const blockchainTimestamp = utils.getBlockchainTimestamp(today);

    const promise = processAuthorReward(accountId, documentId, blockchainTimestamp, requestId);

    promises.push(promise);

  };
  console.log("waitting promises", promises.length)
  Promise.all(promises).then((results) => {
    console.log("SUCCESS Author Confirm Reward Results", results);
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: "done"
      })
    });
  }).catch((errs) => {
    console.error(errs);
    return callback(errs, {
      statusCode: 500,
      body: JSON.stringify({
        message: "done"
      })
    });
  });

};

function processAuthorReward(accountId, documentId, blockchainTimestamp, requestId){
  return new Promise((resolve, reject) => {
    contractUtil.getAuthor3DayRewardOnDocument(accountId, documentId, blockchainTimestamp).then((reward) => {
      console.log("processAuthorReward", requestId, blockchainTimestamp, accountId, documentId, reward);
      updateAuthorReward(accountId, documentId, reward).then((data)=>{
        resolve({
          message:"SUCCESS",
          accountId: accountId,
          documentId: documentId,
          voteAmount: reward,
          blockchainTimestamp: blockchainTimestamp
        });
      }).catch((err) => {
        reject(err);
      })
    }).catch((err) => {
      reject(err);
    });
  });

}

function updateAuthorReward(accountId, documentId, authorReward) {
    // Increment an atomic counter
    const queryKey = {
        "accountId": accountId,
        "documentId": documentId
    }


    const params = {
        TableName:TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set confirmAuthorReward = :authorReward",
        ExpressionAttributeValues:{
            ":authorReward": utils.getNumber(authorReward, 0)
        },
        //ConditionExpression: "attribute_not_exists(confirmViewCountHist.#date)",
        ReturnValues:"UPDATED_NEW"
    };

    return docClient.update(params).promise();



}
