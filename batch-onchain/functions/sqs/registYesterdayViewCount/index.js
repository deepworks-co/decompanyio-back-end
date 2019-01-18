'use strict';


const contractUtil = require('../../commons/contract/contractWapper.js');
const viewCountDynamo = require('./viewCountDynamo.js');
/*
* registYesterdayViewCount
*/
module.exports.handler = (event, context, callback) => {
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };

  // smartcontract DocumentReg function confirmPageView(bytes32 _docId, uint _date, uint _pageView)
  console.log("event", event.Records[0].body);
  const params = JSON.parse(event.Records[0].body);

  if(!params.documentId || isNaN(params.confirmViewCount) || isNaN(params.date)) {
    console.log({message: "Invaild Parameter", params: params});
    return callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: "Invaild Parameter",
        params: params
      })
    });
  }

  //docId = 6ae233c924624384a5c2c819a3139280
  //const docId = web3.utils.hexToUtf8("0x3661653233336339323436323433383461356332633831396133313339323830");
  const documentId = params.documentId;
  //const docId = contractUtil.asciiToHex(params.documentId);
  const documentIdByte32 = contractUtil.asciiToHex(params.documentId);
  const registYesterdayViewCount = params.confirmViewCount;
  const date = params.date;
  const requestId = params.requestId;

  console.log({
    message: "Transaction Start",
    documentIdByte32: documentIdByte32,
    params: params
  });

  //history
  viewCountDynamo.startCronViewCount(documentId, documentIdByte32, date, params);

  contractUtil.getPrepareTransaction().then((values)=>{

    const blockNumber = values.blockNumber;
    const nonce = values.nonce;
    const gasPrice = values.gasPrice;

    contractUtil.getConfirmPageViewEstimateGas(documentIdByte32, date, registYesterdayViewCount).then((estimateGas) => {
      const gasLimit = Math.round(estimateGas);

      contractUtil.sendTransaction(gasPrice, gasLimit, nonce,
        contractUtil.confirmPageViewContract(documentIdByte32, date, registYesterdayViewCount).encodeABI()).then((transaction) => {

        const transcationResult = {
            message: "Transaction Result",
            documentId: documentId,
            documentIdByte32: documentIdByte32,
            transaction: transaction,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce
        }

        console.log(transcationResult);

        viewCountDynamo.completeCronViewCount(documentId, date, transcationResult);

      }).catch((err) => { //error contractUtil.sendTransaction
        //retry
        const transactionException = {
          message: "Transaction Exception",
          error: err,
          documentId: documentId,
          documentIdByte32: documentIdByte32,
          gasLimit: gasLimit,
          gasPrice: gasPrice,
          nonce: nonce
        }
        console.error(transactionException);

        const retryGasPrice = Math.round(gasPrice * 1.5);
        const retryGasLimit = Math.round(gasLimit * 1.5);
        const retryNonce = nonce + 1;
        console.log({
          message: "Retry Transcation Start",
          retryGasPrice: retryGasPrice,
          retryGasLimit: retryGasLimit,
          documentId: documentId,
          documentIdByte32: documentIdByte32,
          nonce: retryNonce
        });

        contractUtil.sendTransaction(retryGasPrice, retryGasLimit, retryNonce,
          contractUtil.confirmPageViewContract(documentIdByte32, date, registYesterdayViewCount).encodeABI()).then((transaction)=>{
          const transcationResult = {
              message: "Retry Transaction Result",
              documentId: documentId,
              documentIdByte32: documentIdByte32,
              transaction: transaction,
              gasLimit: retryGasLimit,
              gasPrice: retryGasPrice,
              nonce: retryNonce
          }
          console.log(transcationResult);
          viewCountDynamo.completeCronViewCount(documentId, date, transcationResult, true);
        }).catch((err) => {
          const transactionException = {
            message: "Retry Transaction Exception",
            error: err,
            documentId: documentId,
            documentIdByte32: documentIdByte32,
            gasLimit: retryGasLimit,
            gasPrice: retryGasPrice,
            nonce: retryNonce
          }
          console.error(transactionException);
          viewCountDynamo.errorCronViewCount(documentId, date, transactionException, true);
        });

      });

    }).catch((err) => {
      console.error("Exception getConfirmPageViewEstimateGas", err);
      viewCountDynamo.errorCronViewCount(documentId, date, {message: "Exception getConfirmPageViewEstimateGas", error: err}, false);
    });

  }).catch((err) => { //error contractUtil.getPrepareTransaction
    console.error("getPrepareTransaction Error", err);
    viewCountDynamo.errorCronViewCount(documentId, date, {message: "Exception getPrepareTransaction", error: err}, false);
  });

  return callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: "done",
      request: context.requestId
    })
  });

};
