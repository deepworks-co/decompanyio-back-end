'use strict';
const R = require('ramda');
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sqs, sns, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');

const web3 = new Web3(walletConfig.mainnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const MAINNET_DECK_ABI = require(`../../mainnet/${stage}/Deck.json`)
const CONTRACT_ADDRESS = MAINNET_DECK_ABI.networks[walletConfig.mainnet.id].address;
const DECK_CONTRACT = new web3.eth.Contract(MAINNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;

const ERROR_TOPIC = `arn:aws:sns:${region}:197966029048:lambda-${stage==="local"?"dev":stage}-alarm`;
 
module.exports.handler = async (event, context, callback) => {
  
  const pendingList = await getPendingRequestWithdraw(tables.WALLET_REQUEST_WITHDRAW);
  if(pendingList.length===0){
    return JSON.stringify({
      success: true,
      message: "There are no withdrawal requests."
    })
  }

  let i;
  for(i=0;i<pendingList.length;i++) {
    try{
      const body = pendingList[i];
      const r = await run({body: JSON.stringify(body)});
      console.log(r);
    }catch(err){
      console.error("run error",  err);
      try{
        const publishResult = await sns.errorPublish(region, ERROR_TOPIC, {event: "withdraw", record: event.Records[i], error: err.stack.split("\n")});
        console.log("error published!!", publishResult)
      } catch(e1){
        console.error("errorPublish fail", e1);
      }
    } finally {
      console.log("job end " + JSON.stringify(event.Records[i]));
      
    }
  }
  return JSON.stringify({success: true});
};

async function run(record) {
  try{
    const params = await validate(record);
    const {from, to, value, privateKey, id} = params;
    const updateCallback = R.curry(updateTransactionProcess)(tables.WALLET_REQUEST_WITHDRAW, {_id: new MongoWrapper.ObjectId(id)});

    const check = await checkRequestWithdraw(tables.WALLET_REQUEST_WITHDRAW, id)
    if(check === true) {    
      const result = await transferDeck(from, to, value, privateKey, updateCallback);
      console.log("transaction complete", {params, transactionHash: result.transactionHash});

      const user  = await getUser(to);
      if(user){
        throw new Error(`user is not exists : ${to}`);
      }

      const saveResult = await saveWalletEvent(tables.WALLET, {
        _id: result.transactionHash,
        userId: user._id,
        address: to,
        type: "WITHDRAW",
        from: from,
        to: to,
        factor: -1,
        value: MongoWrapper.Decimal128.fromString(value + ""),
        created: Date.now()
      });

      console.log("saveWalletEvent ok", saveResult);

      return JSON.stringify({
        success: true
      })
      
    } else {
      const err =  new Error(`${id} request is not pending status`);
      await updateCallback({status: "ERROR", err})
      throw err;
    }

  } catch (err){
    console.error("run error", err);
    throw err;
  }
  
     
}

async function validate(record){
  console.log("validate", record);
  const {body} = record;
  const parsedBody = JSON.parse(body);
  const {value, address, _id, userId} = parsedBody;
  const foundation = await getFoundation(FOUNDATION_ID);

  const privateKey = await decryptPrivateKey(foundation.base64EncryptedEOA);
  
  return {
    from: foundation.address,
    id: _id, 
    userId: userId, 
    to: address,
    value: value,
    privateKey
  }
}
function getUser(ethAccount){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {ethAccount: ethAccount})
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function getFoundation(id){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {_id: id})
    .then((data)=>{
      if(data) resolve(data);
      else reject(new Error(`${id} is not exists`));
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function decryptPrivateKey(base64EncryptedEOA) {

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



function transferDeck(from, to, value, privateKey, callback) {

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

      const r = await sendTransaction(privateKey, rawTransaction, callback);
      resolve(r);
    } catch (err) {
      reject(err);
    }
  })
    
  
}

function sendTransaction(privateKey, rawTransaction, callback) {

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
    .once('transactionHash', async function(hash){
      console.log("transactionHash", hash);
      if(callback){
        await callback({status: "SENDTRANSACTION", result: {transactionHash: hash}, updated: Date.now()});  
      }
      //resolve({transactionHash: hash});
    }).once('receipt', async function(receipt){
      console.log("receipt", receipt);
      if(callback){
        await callback({status: "COMPLETE", result: receipt, updated: Date.now()});  
      }
      resolve(receipt);
    }).on('error', async function(err){
      if(callback){
        await callback({status: "ERROR", error: err, updated: Date.now()});  
      }
      reject(err);
    });
  });
  

}



function updateTransactionProcess(tableName, query, data){
  return new Promise(async (resolve, reject)=>{
    mongo.update(tableName, query, {$set: data})
    .then((data)=>{
      resolve(data);
     })
    .catch((err)=>{
      reject(err);
    })
  })
}

function getPendingRequestWithdraw(tableName){
  return new Promise(async (resolve, reject)=>{
    try{
      const pendingList = await mongo.find(tableName, {
        query: {status: "PENDING"},
        sort: {_id: 1}
      });
      
      resolve(pendingList);
    } catch(err){
      reject(err);
    }
    
  })
}

function checkRequestWithdraw(tableName, id) {
  return new Promise(async (resolve, reject)=>{
    try{
      const request = await mongo.findOne(tableName, {_id: new MongoWrapper.ObjectId(id)});
      
      if(request && request.status === "PENDING"){
        resolve(true);
      } else {
        resolve(false)
      }
    } catch(err){
      reject(err);
    }
    
  })
}

function saveWalletEvent(tableName, params){
  return new Promise((resolve, reject)=>{
    mongo.save(tableName, params).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err)
    });
  })
}