'use strict';
const fs = require('fs');
const jsonFile = "contracts-rinkeby/DocumentReg.json";

const ContractWapper = require('../ContractWapper');
const { mongodb, tables, ethereum } = require('../../resources/config.js').APP_PROPERTIES();

/**
 * @function writePageview
 * @description
 * smartcontract DocumentReg.confirmPageView(bytes32 _docId, uint _date, uint _pageView)
 */
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event.Records));
  const parsed= JSON.parse(fs.readFileSync(jsonFile));
  
  const params = JSON.parse(event.Records[0].body);
  const providerUrl = ethereum.providerUrl;
  const account = ethereum.account;
  const privateKey = ethereum.privateKey;
  const networkIndex = ethereum.index;

  const contractWapper = new ContractWapper(parsed.abi, providerUrl, parsed.networks[networkIndex], account, privateKey);
  console.log(params);
  if(!params.documentId || isNaN(params.confirmPageview) || isNaN(params.date)) {
    return (null, "Invaild Parameter");
  }
  const {documentId, confirmPageview, date} = params;
  const documentIdByte32 = contractWapper.asciiToHex(documentId);

  console.log("Transaction Request Start", documentIdByte32, params);

  const values = await contractWapper.getPrepareTransaction();
 
  const recentlyBlockNumber = values.blockNumber;
  const nonce = values.nonce;
  const gasPrice = values.gasPrice;

  const estimateGas = await contractWapper.getConfirmPageViewEstimateGas(documentIdByte32, date, confirmPageview);
  const gasLimit = Math.round(estimateGas);

  const transactionResult = await contractWapper.sendTransaction(gasPrice, gasLimit, nonce, 
    contractWapper.confirmPageViewContract(documentIdByte32, date, confirmPageview).encodeABI());

 
  console.log("Transaction Request Result", {documentIdByte32, params, recentlyBlockNumber, nonce, gasPrice, transactionResult});

  return (null, "complete");

};
