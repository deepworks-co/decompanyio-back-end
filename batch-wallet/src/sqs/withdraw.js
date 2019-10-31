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

  /*
  * 출금의 경우 psnet에 소지한 Deck을 foundation으로 이동시켜 출금 신청을 하면,
  * mainnet의 foundation은 출금신청된 DECK을 해당 USER의 계정으로 이동시킨다.
  */

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
    //callback(null, err);
    callback(err);
  })

};

function run(record) {

  return new Promise((resolve, reject)=>{
    validate(record)
    .then(async (params)=>{
      console.log("vaildate parameter", params);
      const {logId} = params;
      const check = await checkWithdrawResult(tables.WALLET_WITHDRAW, {_id: logId});
      console.log("checkWithdrawResult", check)
      return params;
    })
    .then(async (params)=>{
      //console.log("params", params)
      const {logId, from, to, value, privateKey} = params;
      const result = await transferDeck(from, to, value, privateKey);
      return {
        logId,
        result
      }
    })
    .then(async (data)=>{
      const {logId, result} = data;
      console.log("transaction info", data);
      const updateResult = await updateWithdrawResult(tables.WALLET_WITHDRAW, {_id: logId}, {result: result});
      console.log("updateWithdrawResult", updateResult)
      return data;
    })
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      console.error(err);
      resolve(err);
    })
  })

}

async function validate(record){
  const {body} = record;
  const parsedBody = JSON.parse(body);
  const {id, returnValues} = parsedBody;
  const {from, to, value} = returnValues;

  const foundation = await getWalletAccount(FOUNDATION_ID);
  const privateKey = await decryptPrivateKey(foundation);

  if(foundation.address !== to){
    throw new Error("this address is not foundation!! : " + to);
  }

  const withdrawUser = await getUser(from);

  console.log("psnet address", from, "mainnet address", withdrawUser.ethAccount);

  return {
    logId: id,
    from: foundation.address,
    to: withdrawUser.ethAccount,
    value,
    privateKey
  }
}
function getUser(ethAccount){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.USER, {ethAccount: ethAccount})
    .then((data)=>{
      if(data) resolve(data);
      else reject(new Error(`${ethAccount} is not exists in USER Collection`));
    })
    .catch((err)=>{
      reject(err);
    })
  })
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
      resolve(r);
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


function checkWithdrawResult(tableName, query) {
  return new Promise((resolve, reject)=>{
    mongo.find(tableName, {query: query})
    .then((data)=>{
      if(data[0] && data[0].result){
        console.log("already withdraw result saved", JSON.stringify(data[0].psnet));
        reject(new Error("already withdraw result saved"))
      } else {
        resolve(true);
      }
        
    })
    .catch((err)=>{
      reject(err);
    })
  });  
}

function updateWithdrawResult(tableName, query, data){
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