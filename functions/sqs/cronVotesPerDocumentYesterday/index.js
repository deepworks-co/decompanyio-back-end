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
  console.log("event", event.Records[0].body);
  const params = JSON.parse(event.Records[0].body);

  const documentId = params.documentId;
  const accountId = params.accountId;
  const today = new Date(); /* 현재 */
  //const yesterday = today.setDate(yesterday.getDate() - 1);
  const blockchainTimestamp = params.date?params.date:utils.getBlockchainTimestamp(today);//today

  contractUtil.getCuratorDepositOnDocument(documentId, blockchainTimestamp).then((voteAmount) => {
    console.log("getCuratorDepositOnDocument", blockchainTimestamp, documentId, voteAmount);
    updateVoteAmount(accountId, documentId, voteAmount, blockchainTimestamp);

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: "done"
      })
    });

  }).catch((err) => {
    console.error(err);
  });

};

function updateVoteAmount(accountId, documentId, voteAmount, blockchainTimestamp) {
    // Increment an atomic counter
    const queryKey = {
        "accountId": accountId,
        "documentId": documentId
    }

    const params = {
        TableName:TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set confirmVoteAmount = :confirmVoteAmount",
        ExpressionAttributeNames: {
            "#date": blockchainTimestamp
        },
        ExpressionAttributeValues:{
            ":confirmVoteAmount": utils.getNumber(voteAmount, 0)
        },
        //ConditionExpression: "attribute_not_exists(confirmViewCountHist.#date)",
        ReturnValues:"UPDATED_NEW"
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.error(JSON.stringify({
                message: "Error updateVoteAmount to update item.",
                params: params,
                err: err
            }));
        } else {
            console.log("SUCCESS updateVoteAmount UpdateItem", params);
        }
    });


}
