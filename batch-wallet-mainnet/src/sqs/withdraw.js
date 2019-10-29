'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sqs, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');

const web3 = new Web3(walletConfig.mainnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const MAINNET_DECK_ABI = require(`../../mainnet/${stage}/Deck.json`)
const CONTRACT_ADDRESS = MAINNET_DECK_ABI.networks[walletConfig.mainnet.id].address;
const DECK_CONTRACT = new web3.eth.Contract(MAINNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;
module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const procs = event.Records.map((record) => {
    return run(record);
  } )


  Promise.all(procs)
  .then((data)=>{
    callback(null, data);
  })
  .catch((err)=>{
    console.error(err);
    callback(err);
  })

};

function run(record) {
  //console.log("run record", record);
  return new Promise((resolve, reject)=>{
    validate(record)
    .then((params)=>{
      //console.log("params", params)
      const {messageId, receiptHandle, message, privateKey} = params;
      console.log("get message", message);
      const {from, to, value} = message;
      return transferDeck(from, to, value, privateKey);
    })
    .then(async (data)=>{
      const {transaction, event} = data;
      const saveData = {
        _id: transaction.transactionHash,
        transaction,
        event
      }
        
      const r = await saveWithdraw(saveData);
      return data;
    })
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err)
    })
  })

}

async function validate(record){
  const {messageId, receiptHandle, body} = record;

  const fouondation = await getWalletAccount(FOUNDATION_ID);
  const privateKey = await decryptPrivateKey(fouondation);

  return {
    messageId,
    receiptHandle,
    message: JSON.parse(body),
    privateKey
  }
}

function getWalletAccount(userId){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {_id: userId})
    .then((data)=>{
      if(data) resolve(data);
      else reject(new Error(`${userId} is not exists`));
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function decryptPrivateKey(walletUser) {
  const {base64EncryptedEOA} = walletUser;
  return new Promise((resolve, reject)=>{
    const encryptedData = Buffer.from(base64EncryptedEOA, 'base64');
    kms.decrypt(region, encryptedData)
    .then((data)=>{
      const {privateKey} = JSON.parse(data.Plaintext.toString("utf-8"));
      const privateKeyBuffer = new Buffer(privateKey.substring(2), 'hex')
      resolve(privateKeyBuffer);
    })
    .catch((err)=>{
      console.log(err);
      reject(err);
    })
    
  });
  
}



function transferDeck(from, to, value, privateKey) {

  return new Promise(async (resolve, reject)=>{
    try{
      const transferMethod = DECK_CONTRACT.methods.transfer(to, value);
  
      const estimateGas = await transferMethod.estimateGas({
        from: from
      });
      const gasLimit = Math.round(estimateGas);
      
      console.log("gasLimit", gasLimit);
      const gasPrice = await web3.eth.getGasPrice();

      const nonce = await web3.eth.getTransactionCount(from);
        //creating raw tranaction
      const rawTransaction = {
        "nonce": web3.utils.toHex(nonce),
        "gasPrice": web3.utils.toHex(gasPrice),
        "gasLimit": web3.utils.toHex(gasLimit),      
        "to": CONTRACT_ADDRESS,
        "value": "0x0",
        "data": transferMethod.encodeABI()
      }

      const r = await sendTransaction(privateKey, rawTransaction);
      resolve({transaction: r, event: {from, to, value}});
    } catch (err) {
      reject(err);
    }
  })
    
  
}

function sendTransaction(privateKey, rawTransaction) {

  return new Promise((resolve, reject)=>{
    if(!privateKey){
      reject(new Error("sender privateKey is undefined"));
    }

    if(!rawTransaction){
      reject(new Error("rawTransaction is undefined"));
    }
    
    //creating tranaction via ethereumjs-tx     
    const transaction = new Transaction(rawTransaction);
    //console.log(transaction);

    //signing transaction with private key
    transaction.sign(privateKey);
    //sending transacton via web3js module
    web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
    .once('transactionHash', function(hash){
      console.log("transactionHash", hash);
      //resolve({success: true, transactionHash: hash});
    }).once('receipt', function(receipt){
      console.log("receipt", receipt);
      resolve(receipt);
    })
  });
  

}


function saveWithdraw(data){
  return new Promise((resolve, reject)=>{
    mongo.save(tables.WALLET_WITHDRAW, data)
    .then((data)=>{
      resolve(data);
     })
    .catch((err)=>{
      reject(err);
    })
  })
}