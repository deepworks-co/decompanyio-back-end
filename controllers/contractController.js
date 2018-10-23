'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/43132d938aaa4d96a453fd1c708b7f6c"));
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const parsed= JSON.parse(fs.readFileSync(jsonFile));
const abis = parsed.abi;

const myAddress = "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15";//priv.address;
const privateKey = Buffer.from("E8760C95C5B615D791DFC1FAB3C4B736217845D5E818CA2472BD2D8E34C8CAB6", 'hex')
//contract abi is the array that you can get from the ethereum wallet or etherscan
const contractABI = abis;
const contractAddress ="0x78817aae0586d1d4ba61475deeecee63d3236b00";


module.exports.getDocuments = (event, context, callback) => {
    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
  const DocumentReg = new web3.eth.Contract(abis, contractAddress, {
    from: myAddress
  });

  DocumentReg.methods.getDocuments().call({from: myAddress}).then((data)=>{
    console.log(data);
  });

  return callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify("done")
  });

};


module.exports.registYesterdayViewCount = (event, context, callback) => {
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
  const params = JSON.parse(event.body);
  console.log(params);

  //docId = 6ae233c924624384a5c2c819a3139280
  //const docId = web3.utils.hexToUtf8("0x3661653233336339323436323433383461356332633831396133313339323830");
  const docId = web3.utils.asciiToHex(params.documentId);
  console.log("docId", params.documentId, docId);
  const registYesterdayViewCount = params.confirmViewCount;
  const date = params.date;

  console.log("Transcation Start", docId, date, registYesterdayViewCount);
  //creating contract object
  const DocumentReg = new web3.eth.Contract(abis, contractAddress, {
    from: myAddress
  });

  web3.eth.getBlockNumber().then((blockNumber)=>{
    //console.log("blockNumber", blockNumber);

    web3.eth.getTransactionCount(myAddress, blockNumber).then((nonce) => {
      //console.log("nonce", nonce);

      var amount = web3.utils.toHex(1e16);
      //creating raw tranaction
      var rawTransaction = {
          "from":myAddress,
          "gasPrice":web3.utils.toHex(20* 1e9),
          "gasLimit":web3.utils.toHex(210000),
          "to":contractAddress,
          "value":"0x0",
          "data":DocumentReg.methods.confirmPageView(docId, date, registYesterdayViewCount).encodeABI(),
          "nonce": web3.utils.toHex(nonce)
      }
      console.log("Raw Transcation", rawTransaction);
      //creating tranaction via ethereumjs-tx
      var transaction = new Tx(rawTransaction);
      //signing transaction with private key
      transaction.sign(privateKey);
      //sending transacton via web3js module
      web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex')).then((transaction)=>{
        console.log("Transaction Result", transaction);
      }).catch((err) => {
        console.error("Transaction Error", err);
      });

    });
  });


  return callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify("done")
  });

};
