'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');

/*
* @description 
* 사용안함!!!
*/
/**
 * @description
 *  - 문서의 Vote Amount를 'DOCUMENT-FEATURE' 에 저장한다.
 */
module.exports.handler = async (event, context, callback) => {
  
  const wapper = new MongoWapper(mongodb.endpoint);

  try{

    const bulk = wapper.getUnorderedBulkOp(tables.DOCUMENT_FEATURED);
    const contractWapper = new ContractWapper();
    const now = new Date();
    const blockchainTimestamp = utils.getBlockchainTimestamp(now); //today
  
    const promises = await event.Records.map(async (record, index) => {
    
      const body = JSON.parse(record.body); 
      const {documentId} = body;
      const doc = await wapper.findOne(tables.DOCUMENT, {_id: documentId});
      console.log("find doc", index, JSON.stringify(doc));
      const voteAmount = JSON.parse(await contractWapper.getCuratorDepositOnDocument(documentId, blockchainTimestamp));
      const newDoc = {
        _id: doc._id,
        accountId: doc.accountId,
        tags: doc.tags,
        created: doc.created,
        title: doc.title,
        seoTitle: doc.seoTitle,
        desc: doc.desc,
        latestVoteAmount: Number(voteAmount),
        latestVoteAmountUpdated : now.getTime(),
        latestVoteAmountDate: now
      }

      console.log(doc._id, doc.latestVoteAmount, doc.latestVoteAmountDate);
      bulk.find({_id: doc._id}).upsert().replaceOne(newDoc);
      return {documentId, voteAmount, index};
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
