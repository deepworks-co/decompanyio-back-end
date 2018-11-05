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
  let yesterday = new Date(); /* 현재 */
  yesterday.setDate(yesterday.getDate() - 1);
  const blockchainTimestamp = utils.getBlockchainTimestamp(yesterday);//yesterday

  contractUtil.getCuratorDepositOnDocument(documentId, blockchainTimestamp).then((voteAmount) => {
    console.log("SUCCESS yesterday", blockchainTimestamp, documentId, voteAmount);

    getSumConfirmVoteAmount(documentId, blockchainTimestamp).then((data) => {
      updateVoteAmount(accountId, documentId, voteAmount + data, blockchainTimestamp);
    }).catch((err) => {
      console.error(err);
    })

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

function getSumConfirmVoteAmount(documentId, blockchainTimestamp) {


  return new Promise((resolve, reject) => {
    const params = {
        TableName: TABLE_NAME,
        IndexName: "documentId-index",
        KeyConditionExpression: "#documentId = :documentId",
        ExpressionAttributeNames:{
            "#documentId": "documentId"
        },
        ExpressionAttributeValues: {
            ":documentId": documentId
        }
    }

    docClient.query(params, (err, data) => {

      if(err){
        reject(err);
      } else {
        const result = data.Items[0];
        console.log("result", result, result.confirmVoteAmountHist);
        let now = 0;
        if(result.confirmVoteAmountHist ) {

          for(const k in result.confirmVoteAmountHist) {
            const v = result.confirmVoteAmountHist[k];
            console.log("loop", k, v);
            if(k!=blockchainTimestamp){
              now += v;
            }
          }

        }
        resolve(now);
      }

    });
  });
}

function updateVoteAmount(accountId, documentId, voteAmount, blockchainTimestamp) {
    // Increment an atomic counter
    const queryKey = {
        "accountId": accountId,
        "documentId": documentId
    }

    //confirmViewCountHist Key isNotExist create
    docClient.update({
        TableName:TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set confirmVoteAmountHist = if_not_exists(confirmVoteAmountHist, :emptyMap)",
        ExpressionAttributeValues:{
            ":emptyMap": {}
        },
        ReturnValues:"UPDATED_NEW"
    }, function(err, data) {
        if(err){
            console.error(JSON.stringify({
                message: "confirmVoteAmountHist init empty",
                error:err})) ;
        }

        const params = {
            TableName:TABLE_NAME,
            Key:queryKey,
            UpdateExpression: "set confirmVoteAmount = :confirmVoteAmount, confirmVoteAmountHist.#date = :confirmVoteAmount",
            ExpressionAttributeNames: {
                "#date": blockchainTimestamp
            },
            ExpressionAttributeValues:{
                ":confirmVoteAmount": utils.getNumber(voteAmount)
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

    });


}
