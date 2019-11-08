'use strict';
const {tables} = require("decompany-app-properties");


module.exports = (context, params) => {
  const {wallet, mongo} = context;
  const {principalId} = params;
  console.log("params", params);

  return new Promise((resolve, reject) =>{
    getWalletAccount(mongo, principalId)
    .then(async (account)=>{
      if(!account || !account.address){
        throw new Error("account is not exists");
      }
      //console.log("account", account);
      const balance = await wallet.getBalance(account.address);
      const deck = await wallet.getDeckBalance(account.address);
      resolve({wei: balance, deck})
    })
    .catch((err)=>{
      console.error("getBalance error", err);
      reject(err);
    })
  });
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

