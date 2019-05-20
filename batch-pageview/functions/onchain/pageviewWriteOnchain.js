'use strict';

const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');

const LIMIT = 5000;
/**
 * @function pageviewWriteOnchain
 * @description
 */
module.exports.handler = async (event, context, callback) => {

  try{
    const now = new Date();
    const yesterday = new Date(now - 1000 * 60 * 60 * 24);
    let blockchainTimestamp = utils.getBlockchainTimestamp(yesterday);

    if(event.blockchainTimestamp){
      console.log("input blockchainTimestamp", event.blockchainTimestamp);
      blockchainTimestamp = event.blockchainTimestamp
    } 
   
    
    const contractWapper = new ContractWapper();  
    const resultList = await getList(blockchainTimestamp, LIMIT);
    const remains = resultList.length === 'undefined'? 0:resultList.length
    console.log("getList", remains);
    if(remains === 0){
      return {
        remains: 0
      };
    } 

    let documentIds = [];
    let pageviews = [];
    let docIds = [];
    resultList.forEach((doc)=>{
      const documentIdByte32 = contractWapper.asciiToHex(doc.documentId);
      documentIds.push(documentIdByte32);
      pageviews.push(doc.pageview);
      docIds.push(doc.documentId);
    });


    console.log("length (resultList, documentIds, pageviews)", resultList.length, documentIds.length, pageviews.length);
    console.log("docIds", docIds);
    
    if(resultList.length !== documentIds.length || documentIds.length !== pageviews.length){
      throw new Error("result list aggreagation fail...", resultList.length, documentIds.length, pageviews.length);
    }

    
    console.log("Transaction Request Start");

    const result = await contractWapper.sendTransactionConfirmPageView(blockchainTimestamp, documentIds, pageviews);
    console.log("Transaction Result", result);


    const result2 = await updateTransactionResult(blockchainTimestamp, docIds, result);
    console.log("Transaction Update", result2);

 
    console.log("Transaction Request End");

    const remainsList = await getList(blockchainTimestamp, LIMIT);
    console.log("remainsList", remainsList.length);
    return {
      remains: remainsList.length
    };

  } catch(error){
    console.error(error);
    throw new Error("document pageview write on chain fail...");
  }

};


function parse(message){
  //JSON.parse(event.Records[0].body);
  try{
    return JSON.parse(message);
  } catch (e) {
    console.error("parse error", message);
  } 
}

async function getList(blockchainTimestamp, limit){
  console.log("getList", {blockchainTimestamp, limit});
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const queryPipeline = [{
      $match: { 
        blockchainTimestamp: blockchainTimestamp, 
        "transactionHash.success": {$ne: true}

      }
    }, {
      $lookup: {
        from: tables.EVENT_REGISTRY,
        localField: "documentId",
        foreignField: "documentId",
        as: "RegsitryAs"
      }
    }, {
      $unwind: {
        path: "$RegsitryAs",
        "preserveNullAndEmptyArrays": true
      }
    }, {
      "$match": {
        "RegsitryAs": { "$exists": true, "$ne": null }
      }
    }, {
      $limit: limit
    }]

    return await wapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    console.log(err);
    throw err;
  } finally{
    wapper.close();
  }
}

async function updateTransactionResult(blockchainTimestamp, documentIds, transactionHash){
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const query = {
      blockchainTimestamp: blockchainTimestamp, 
      documentId: {$in: documentIds}
    }
    return await wapper.update(tables.STAT_PAGEVIEW_DAILY, query, {
      $set: {transactionHash: transactionHash}
    }, {
      multi: true
    })
  } catch(e){
    throw e;
  } finally {
    wapper.close();
  }
}