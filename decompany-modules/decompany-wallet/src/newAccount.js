
'use strict';
const Web3 = require('web3');
const {walletConfig, mongodb, tables, region} = require("decompany-app-properties");
const {kms} = require("decompany-common-utils");

const web3 = new Web3(walletConfig.providerUrl);
module.exports = (context, params) => {
  const {wallet, mongo} = context;
  const {principalId} = params;

  return new Promise((resolve, reject)=>{

    isNotExistWalletAccount(mongo, {
      principalId
    })
    .then((user)=>{
      return createAccount();
    }).then((data)=>{
      
      return encrypt({
          region,
          kmsId: walletConfig.kmsId,
          createdAccount: data
        }
      );

    }).then((data)=>{
      
      return saveAccount(mongo, Object.assign(data, {principalId}))
    }).then((data)=>{      
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })

  });

}

function isNotExistWalletAccount(mongo, params){

  if(params.principalId){
    return new Promise(async (resolve, reject)=>{
      try{
        const user = await mongo.findOne(tables.WALLET_USER, {_id: params.principalId});
        if(user){
          reject(new Error("User's wallet account is exists"));
        } else {
          resolve({exists:true});
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