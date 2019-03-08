'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');
const wapper = new MongoWapper(mongodb.endpoint);

/*
* @description 문서에 현재까지(어제 기준) Vote된 Deck
*/
module.exports.handler = async (event, context, callback) => {
  
  try{

    const bulk = wapper.getUnorderedBulkOp(tables.DOCUMENT);
    const contractWapper = new ContractWapper();
    const now = new Date();
    const blockchainTimestamp = utils.getBlockchainTimestamp(now); //today
  
    const promises = await event.Records.map(async (record, index) => {
    
      const body = JSON.parse(record.body); 
      const {documentId} = body;
      const voteAmount = await contractWapper.getDepositOnDocument(documentId, blockchainTimestamp);
      bulk.find({_id: documentId}).update({$set: {confirmVoteAmount: voteAmount, confirmVoteAmountUpdated: Date.now()}})
      return {documentId, voteAmount};
    });
    
    const results = await Promise.all(promises);
    console.log("promise results", results);
    console.log("bulk execute", JSON.stringify(bulk));
    const result = await wapper.execute(bulk);
    console.log(result);
    return callback(null, result);
  } catch(e){
    console.error(e);
    return callback(e);
  } finally {
    wapper.close();
  }
};
