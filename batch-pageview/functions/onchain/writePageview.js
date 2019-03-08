'use strict';
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

/**
 * @function writePageview
 * @description
 * smartcontract DocumentReg.confirmPageView(bytes32 _docId, uint _date, uint _pageView)
 */
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event.Records));
  const json = parse(event.Records[0].body);
  if(!json){
    return callback(null, "message is invail");
  }
  const {documentId, confirmPageview, date} =  json;//JSON.parse(event.Records[0].body);

  if(!documentId || isNaN(confirmPageview) || isNaN(date)) {
    throw new Error("Invaild Parameter");
  }
  
  const contractWapper = new ContractWapper();
  const documentIdByte32 = contractWapper.asciiToHex(documentId);

  const isExist = await contractWapper.isExistsDocument(documentId);
  if(!isExist){
    console.log("Document is not exist in on-chain!", documentId);
    return callback(null, `${documentId} Document is not exist in on-chain!`);
  }

  console.log("Transaction Request Start", documentIdByte32, documentId);

  const values = await contractWapper.getPrepareTransaction();
 
  const recentlyBlockNumber = values.blockNumber;
  const nonce = values.nonce;
  const gasPrice = values.gasPrice;

  const estimateGas = await contractWapper.getConfirmPageViewEstimateGas(documentIdByte32, date, confirmPageview);
  const gasLimit = Math.round(estimateGas);

  const transactionResult = await contractWapper.sendTransaction(gasPrice, gasLimit, nonce, 
    contractWapper.confirmPageViewContract(documentIdByte32, date, confirmPageview).encodeABI());

 
  console.log("Transaction Request Result", {documentIdByte32, documentId, date, confirmPageview, recentlyBlockNumber, nonce, gasPrice, transactionResult});

  return callback(null, "complete");

};


function parse(message){
  //JSON.parse(event.Records[0].body);
  try{
    return JSON.parse(event.Records[0].body);
  } catch (e) {
    console.error("parse error", message);
  } 
}