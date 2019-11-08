'use strict';
const {tables} = require("decompany-app-properties");

module.exports = async (context, params) => {
  const {wallet, mongo} = context;
  const {start} = params;

  const latest = await getSavedLatestBlock(mongo)
  //console.log("latest block", latest);
  //return getBlockDetail(wallet, mongo, latest?latest.number+1:start);
  return getBlockLoop(wallet, mongo, latest?latest.number+1:start);
  
}

function getBlockLoop(wallet, mongo, start){
  let block = null;
  return new Promise((resolve, reject)=>{
    getBlockDetail(wallet, mongo, start)
    .then((data)=>{
      if(data){
        block = data.block;
        //console.log("next blocknumber", Number(block.number) + 1);
        return getBlockLoop(wallet, mongo, Number(block.number) + 1);
      } else {
        resolve({latestBlock: block});
      }
    })
    .catch((err)=>{
      reject(err);
    })
  }); 
  
}

function getBlockDetail(wallet, mongo, blockNumber) {
  let block = null;
  return new Promise((resolve, reject)=>{
    wallet.getBlock(blockNumber)
    .then(async (data)=>{
      block = data;
      //console.log("block", data);
      await saveBlock(mongo, data);
      
      return getReceipt(wallet, data.transactions);
    })
    .then(async (data)=>{
      //console.log("transactions", data);
      await saveTransactions(mongo, data);
      resolve({block});
    })
    .catch((err)=>{
      console.error(err);
      reject(err);
    })
  })
}

function getReceipt(wallet, transactionHashs){
  return new Promise(async (resolve, reject)=>{

    try{
      const transactions = await Promise.all( transactionHashs.map((transactionHash)=>{
        return wallet.getTranscationReceipt(transactionHash);
      }))
  
      resolve(transactions);
    } catch(err){
      reject(err);
    }
    

  });
  
}

function getSavedLatestBlock(mongo) {
  return new Promise((resolve, reject)=>{
    mongo.findData(tables.WALLET_BLOCK, {
      sort: {_id: -1}
    })
    .then((data)=>{
      resolve(data[0]);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function saveBlock(mongo, block) {
  
  return new Promise((resolve, reject)=>{
    mongo.insert(tables.WALLET_BLOCK, Object.assign({_id: block.number, created: Date.now()}, block))
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function saveTransactions(mongo, transactions) {
  if(transactions && transactions.length === 0){
    return Promise.resolve({});
  }
  return new Promise((resolve, reject)=>{

    const items = transactions.map((transaction)=>{
      transaction._id = transaction.hash;
      transaction.created = Date.now();
      return transaction
    });

    mongo.insert(tables.WALLET_TRANSACTION, items)
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}