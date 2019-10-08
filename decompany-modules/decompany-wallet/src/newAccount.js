
'use strict';
const Web3 = require('web3');
const {ethereum, mongodb, tables, region} = require("decompany-app-properties");
const {MongoWrapper, kms} = require("decompany-common-utils");

const web3 = new Web3(ethereum.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

module.exports = (params) => {
  
  const {principalId} = params;

  return new Promise((resolve, reject)=>{

    isNotExistAccount({
      principalId
    })
    .then((user)=>{
      return createAccount();
    }).then((data)=>{
      
      return encrypt(
        {
          region,
          kmsId: ethereum.kmsId,
          createdAccount: data
        }
      );

    }).then((data)=>{
      
      return saveAccount(Object.assign(data, {principalId}))
    }).then((data)=>{
      
      mongo.close();
      resolve(data);
    }).catch((err)=>{
      mongo.close();
      reject(err);
    })

  });

}

function isNotExistAccount(params){

  if(params.principalId){
    return new Promise(async (resolve, reject)=>{
      try{
        const user = await mongo.findOne(tables.WALLET_USER, {_id: params.principalId});
        if(user){
          reject(new Error("User is exists"));
        } else {
          resolve({exists:true});
        }
      } catch(err){
        throw err;
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
      reject(new Error("createAccount error(OWA)"))
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

function saveAccount(params) {
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