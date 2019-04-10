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
  const body = parse(event.Records[0].body);
  if(!body){
    return callback(null, "sqs message is invail", event.Records[0].body);
  }
  const {documentId, confirmPageview, date} = body;

  if(!documentId || isNaN(confirmPageview) || isNaN(date)) {
    //throw new Error("Invaild Parameter");
    return callback(null, "parameter is invalid!!", body);
  }
  
  const contractWapper = new ContractWapper();
  await contractWapper.init();
  const documentIdByte32 = contractWapper.asciiToHex(documentId);

  /*
  * boolean으로 형변환하기 위하여 실제 리턴은 string 타입의 "true" or "false"가 리턴된다.
  * 형변환을 위하여 JSON으로 parse한다. Boolean으로 변경시키면 "true", "false"모두 true가 리턴된다.
  */

  const isExist = JSON.parse(await contractWapper.isExistsDocument(documentId));
  console.log("checking document in blockchain :", isExist, typeof(isExist));
  if(isExist === false){
    console.log("Document was not exists in on-chain!", documentId);
    return callback(null, `${documentId} Document was not exists in on-chain!`);
  } else {
    console.log("Document was exists in on-chain!", documentId);
  }

  console.log("Transaction Request Start", documentIdByte32, documentId);

  /*const transactionResult = await contractWapper.sendTransaction(gasPrice, gasLimit, nonce, 
    contractWapper.confirmPageViewContract(documentIdByte32, date, confirmPageview).encodeABI());*/

  const transactionResult = await contractWapper.sendTransactionConfirmPageView(documentId, date, confirmPageview);
 
  console.log("Transaction Request Result", {documentIdByte32, documentId, date, confirmPageview, transactionResult});

  return callback(null, "complete");

};


function parse(message){
  //JSON.parse(event.Records[0].body);
  try{
    return JSON.parse(message);
  } catch (e) {
    console.error("parse error", message);
  } 
}