'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');
/*
* @description 문서에 현재까지(어제 기준) Vote된 Deck
*/
const wapper = new MongoWapper(mongodb.endpoint);

module.exports.handler = async (event, context, callback) => {
  try{
    let promises = [];
    event.Records.forEach((record) => {

      const body = JSON.parse(record.body);
      
      const {documentId} = body;
      const now = new Date();
      const blockchainTimestamp = utils.getBlockchainTimestamp(now); //today
      const promise = processDepositDocument(documentId, blockchainTimestamp);
      promises.push(promise);

    });
    
    const results = await Promise.all(promises);

    return callback(null, results);
  } catch(e){
    console.error(e);
    return callback(e);
  } finally {
    wapper.close();
  }
  
  

};

async function processDepositDocument(documentId, blockchainTimestamp){
  const contractWapper = new ContractWapper();
  const voteAmount = await contractWapper.getDepositOnDocument(documentId, blockchainTimestamp);
  console.log("getDepositOnDocument result", voteAmount);
  return updateVoteAmount(documentId, voteAmount);   
  
}

async function updateVoteAmount(documentId, voteAmount) {
    // Increment an atomic counter

    const result = await wapper.update(tables.DOCUMENT, {_id: documentId}, {confirmVoteAmount: voteAmount, confirmVoteAmountUpdated: Date.now()});
    console.log("update success", result);
    return result;
}
