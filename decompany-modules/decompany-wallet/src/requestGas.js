'use strict';

const {walletConfig, mongodb, tables, region} = require("decompany-app-properties");
const {MongoWrapper, kms} = require("decompany-common-utils");
const WalletWrapper = require("./lib/WalletWrapper");


const REQUEST_ETHER = 1;//ether
const GAS_SENDER_ID = "miner"
module.exports = (context, params) => {
  const {wallet, mongo} = context;
  const {principalId} = params;
  console.log("params", params);

  getWalletAccount(mongo, GAS_SENDER_ID)
  .then(async (miner)=>{
    console.log("get miner", miner);
    const requester = await getWalletAccount(mongo, principalId);
    return {miner, requester}
  })
  .then(async (data)=>{
    const {miner, requester} = data;
    const privateKey = await decryptPrivateKey(miner);
    return {miner, requester, privateKey}
  })
  .then((data)=>{
    return sendGas(wallet, data);
  })
  .then((data)=>{
    console.log(data);
  })
  .catch((err)=>{
    console.error("reqest gas error", err);
  })
}

function getWalletAccount(mongo, userId){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {_id: userId})
    .then((data)=>{
      resolve(data);
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

function sendGas(wallet, params) {

  const {miner, requester, privateKey} = params;
  
  return wallet.sendGas(
    {
      address: miner.address, 
      privateKey
    }, {
      address: requester.address
    }, 
    REQUEST_ETHER);
}

