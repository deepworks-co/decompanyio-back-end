'use strict';

const TABLE_NAME = "DEV-CA-DOCUMENT";

const contractUtil = require('../../commons/contract/contractWapper.js');
const utils = require('../../commons/utils.js');
const MongoWapper = require('../libs/mongo/MongoWapper.js');
const connectionString = 'mongodb://decompany:decompany1234@localhost:27017/decompany';
/*
* registYesterdayViewCount
*/
module.exports.handler = (event, context, callback) => {
  console.log("event.Records", event.Records.length, "records", event.Records);
  let promises = [];
  for( const i in event.Records) {

    const body = event.Records[i].body;

    let params = null;

    params = JSON.parse(body);
    console.log("SQS message body string", body, typeof(body));

    const documentId = params.documentId;
    const accountId = params.accountId;
    const requestId = params.requestId;
    const today = new Date();
    //const yesterday = today.setDate(today.getDate() - 1);
    const blockchainTimestamp = utils.getBlockchainTimestamp(today);



    console.log("SQS message Params", accountId, documentId, blockchainTimestamp, requestId);
    const promise = processAuthorReward(accountId, documentId, blockchainTimestamp, requestId);

    promises.push(promise);

  };
  console.log("waitting promises", promises.length)
  Promise.all(promises).then((results) => {
    console.log("SUCCESS Author Confirm Reward Results", results);
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: "success"
      })
    });
  }).catch((errs) => {
    console.error("ERROR Author Confirm Reward Results", errs);
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: "error"
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

async function updateAuthorReward(accountId, documentId, authorReward) {
    // Increment an atomic counter
    const query = {
        documentId: documentId
    }

    const wapper = new MongoWapper(connectionString);
    let document = await wapper.findOne(TABLE_NAME, query);
    document.confirmAuthorReward = utils.getNumber(authorReward, 0);    
    return await wapper.save(TABLE_NAME, document);
}
