'use strict';
const Web3 = require('web3');
const {walletConfig, tables, region, mongodb} = require("decompany-app-properties");
const {kms, MongoWrapper} = require("decompany-common-utils");

const web3 = new Web3(walletConfig.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);
module.exports.handler = async (event, context, callback) => {

  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }
  context.callbackWaitsForEmptyEventLoop = false;
  
  const {principalId} = event;
  try{

    const account = await newAccount({principalId});

    const response = JSON.stringify({
      success: true, 
      address: account.address,
      message: account.message
    });
    return response;

  } catch(err){
    //console.error(err);
    throw new Error(`[500] ${err}`);
    
  }
  
};

function newAccount(params) {

  const {principalId} = params;

  return new Promise(async (resolve, reject)=>{
    try{
      const user = await isNotExistWalletAccount(mongo, {
        principalId
      });
      console.log("user", user);
      if(user.exists === true){
        return resolve({exists: true, address: user.address, message: "user's wallet account already exists"})
      } 
      
      const createdAccount = await createAccount();
          
      const encryptedAccount = await encrypt({
        region,
        kmsId: walletConfig.kmsId,
        createdAccount: createdAccount
      });
  
      const saveResult = await saveAccount(mongo, Object.assign(encryptedAccount, {principalId}));

      console.log("newAccount saveResult", saveResult)

      resolve({address: createdAccount.address});
    } catch(err){
      reject(err);
    }
    

    

  });
}


function isNotExistWalletAccount(mongo, params){

  if(params.principalId){
    return new Promise(async (resolve, reject)=>{
      try{
        const user = await mongo.findOne(tables.WALLET_USER, {_id: params.principalId});
        
        if(user){
          resolve({exists:true, address: user.address, message: "User's wallet account is exists"});
          //reject(new Error("User's wallet account is exists"));
        } else {
          resolve({exists:false});
        }
      } catch(err){
        reject(err);
      }

    })
    
  } else {
    throw new Error("principalId is undefined");
  }
  
}


function createAccount(){
  return new Promise((resolve, reject)=>{
    const result = web3.eth.accounts.create("decompany");
    if(result){
      resolve(result);
    } else {
      reject(new Error("createAccount error(EOA)"))
    }
    

  })
}


function encrypt(params) {
  const {region, kmsId, createdAccount} = params;
  
  return new Promise((resolve, reject)=>{
    kms.encrypt(region, kmsId, JSON.stringify(createdAccount))
    .then((data)=>{
      const base64EncryptedEOA = data.CiphertextBlob.toString('base64');
      console.log("encrypt", data);
      resolve({
        address: createdAccount.address,
        base64EncryptedEOA
      });
    }).catch((err)=>{
      reject(err);
    })
  })
  
}

function saveAccount(mongo, params) {
  const {principalId, address, base64EncryptedEOA} = params;
  return new Promise((resolve, reject)=>{

    mongo.insert(tables.WALLET_USER, {_id: principalId, address: address, base64EncryptedEOA: base64EncryptedEOA, created: Date.now()})
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
    
  });
  
}

function printAccount(params) {
  console.log("printAccount", params);
  const {principalId, address, base64EncryptedEOA} = params;
  return new Promise((resolve, reject)=>{
    const encryptedData = Buffer.from(base64EncryptedEOA, 'base64');
    kms.decrypt(region, encryptedData)
    .then((data)=>{
      console.log("decrypted eoa", data.Plaintext.toString("utf-8"));
      resolve(data);
    })
    .catch((err)=>{
      console.log(err);
      reject(err);
    })
    
  });
  
}