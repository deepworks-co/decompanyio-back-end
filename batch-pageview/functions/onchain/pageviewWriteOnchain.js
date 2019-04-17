'use strict';

const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');
/**
 * @function pageviewWriteOnchain
 * @description
 */
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event.Records));
  const body = parse(event.Records[0].body);
  try{
    if(!body){
      throw new Error("sqs message body is invalid!!");
    }
    const {blockchainTimestamp, count, unit, endIndex, index} = body;
  
    if(isNaN(unit) || isNaN(count) || isNaN(blockchainTimestamp) || isNaN(endIndex) || isNaN(index)) {
      //throw new Error("Invaild Parameter");
      throw new Error("parameter is invalid!!");
    }

    const contractWapper = new ContractWapper();  
    const resultList = await getList(blockchainTimestamp, index, unit);
    //console.log("getList", resultList);
    if(resultList.length === 0){
      return "resultList is zero";
    }

    let documentIds = [];
    let pageviews = [];
    resultList.forEach((doc)=>{
      const documentIdByte32 = contractWapper.asciiToHex(doc.documentId);
      documentIds.push(documentIdByte32);
      pageviews.push(doc.pageview)
    });
    console.log("length (resultList, documentIds, pageviews)", resultList.length, documentIds.length, pageviews.length);
    
    if(resultList.length !== documentIds.length || documentIds.length !== pageviews.length){
      throw new Error("result list aggreagation fail...", resultList.length, documentIds.length, pageviews.length);
    }

    
    
    console.log("Transaction Request Start");
    //const result = await contractWapper.sendTransactionConfirmPageView(documentId, date, confirmPageview);
    
    //for test ()
    /*
    const testDocIds = ['0x3562616230396466373065643433303761616436363733303066633063393563', '0x3562616230396466373065643433303761616436363733303066633063393563']; //5bab09df70ed4307aad667300fc0c95c
    const testPageviews = [2, 2];
    const testBlockchainTimestamp = "1554940800000"
    const result = await contractWapper.sendTransactionConfirmPageView(testBlockchainTimestamp, testDocIds, testPageviews);
    */
    const result = await contractWapper.sendTransactionConfirmPageView(blockchainTimestamp, documentIds, pageviews);

    console.log("Transaction Request End");
  } catch(error){
    console.error(error);
    throw new Error("document pageview write on chain fail...");
  }

  return "complete";
};


function parse(message){
  //JSON.parse(event.Records[0].body);
  try{
    return JSON.parse(message);
  } catch (e) {
    console.error("parse error", message);
  } 
}

async function getList(blockchainTimestamp, skip, limit){
  console.log("getList", {blockchainTimestamp, skip, limit});
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const queryPipeline = [{
      $match: { blockchainTimestamp: blockchainTimestamp }
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
      $skip: skip
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