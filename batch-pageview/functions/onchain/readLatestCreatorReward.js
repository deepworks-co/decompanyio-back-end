'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');

/*
* @description 문서에 현재까지(어제 기준) Vote된 Deck
*/
module.exports.handler = async (event, context, callback) => {
  
  const wapper = new MongoWapper(mongodb.endpoint);

  try{
    
    const bulk = wapper.getUnorderedBulkOp(tables.DOCUMENT_POPULAR);
    const contractWapper = new ContractWapper();
      
    const promises = await event.Records.map(async (record, index) => {
      
      const body = JSON.parse(record.body); 
      console.log("sqs parameter", body);

      const {documentId, blockchainTimestamp} = body;

      const isExist = JSON.parse(await contractWapper.isExistsDocument(documentId));
      const doc = await wapper.findOne(tables.DOCUMENT, {_id: documentId});
      if(!isExist || !doc){
        return callback(null, {error: `a document is not exists on-chain ${documentId}`, documentId: documentId});
      }


      const ethAccount = doc.ethAccount;

      if(!documentId || isNaN(blockchainTimestamp) || !ethAccount){
        return {error: `parameter is invalid!!(documentId, blockchainTimestamp, ethAccount) ${documentId}, ${blockchainTimestamp}, ${ethAccount}`, documentId};
      } else {
        //console.log(documentId, blockchainTimestamp, ethAccount);
        const latestCreatorReward = JSON.parse(await contractWapper.getAuthor3DayRewardOnDocument(ethAccount, documentId, blockchainTimestamp));
        bulk.find({_id: documentId}).update({$set: {latestCreatorReward: latestCreatorReward, latestCreatorRewardUpdated: Date.now()}})
        return {documentId, latestCreatorReward};
      }
      
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
