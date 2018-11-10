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
  //console.log(accountId, documentId);
  const today = new Date();
  //const yesterday = today.setDate(today.getDate() - 1);

  const blockchainTimestamp = utils.getBlockchainTimestamp(today);
  contractUtil.getAuthor3DayRewardOnDocument(accountId, documentId, blockchainTimestamp).then((voteAmount) => {
    console.log("SUCCESS Author Confirm Reward", blockchainTimestamp, documentId, voteAmount);
    updateAuthorReward(accountId, documentId, voteAmount)
  }).catch((err) => {
    console.error(err);
  });


  return callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: "done"
    })
  });

};

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
            ":authorReward": utils.getNumber(authorReward)
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
