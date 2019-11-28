'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {sqs, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const web3 = new Web3(walletConfig.mainnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const MAINNET_DECK_ABI = require(`../../mainnet/${stage}/Deck.json`)
const CONTRACT_ADDRESS = MAINNET_DECK_ABI.networks[walletConfig.mainnet.id].address;
const DECK_CONTRACT = new web3.eth.Contract(MAINNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;

module.exports.handler = async (event, context, callback) => {
  
  
  const last = await getLatestTransferLog(tables.DECK_TRANSFER)
  //const blockNumber = last?last.blockNumber + 1:1;
  const blockNumber = 1;//5508236;
  const foundation = await getWalletAccount(FOUNDATION_ID);

  const eventLogs = await getEventLog(DECK_CONTRACT, {
    fromBlock: blockNumber,
    toBlock: "latest",
    eventName: "Transfer"
  });

  console.log("get event", eventLogs.length );
  const r = await saveTransfer(tables.DECK_TRANSFER, eventLogs);
  console.log("saveTransfer event", r);


  const incomings = eventLogs.filter((log)=>{
    const {transactionHash, returnValues} = log;
    return (foundation.address === returnValues.from || foundation.address === returnValues.to)
  }).map(async (log)=>{
    //console.log("filted", log)
    const {transactionHash } = log;
    const {from, to, value} = log.returnValues;
    if(foundation.address === from){
      //출금
      const user = await getUser(to);
      const userId = user?user._id:undefined;
      return {transactionHash, userId: userId, address: to, type: "WITHDRAW", from, to, value, factor: -1}
    } else {
      //입금
      const user = await getUser(from);
      const userId = user?user._id:undefined;
      return {transactionHash, userId: userId, address: from, type: "DEPOSIT", from, to, value, factor: 1}
    }
    
  });

  console.log("incomings", incomings.length);

  const r2 = await saveWalletLogs(tables.WALLET, await Promise.all(incomings));
  console.log("saveWalletLogs", r2)

  return JSON.stringify({success: true});
  
};

function getLatestTransferLog(tableName){
  return new Promise((resolve, reject)=>{
    mongo.find(tableName, {
      sort: {
        "blockNumber": -1
      },
      limit: 1      
    }).then((data)=>{
      resolve(data[0]);
    })
    .catch((err)=>{
      reject(err)
    })
  });
}

function getEventLog(contract, params) {
  const {fromBlock, toBlock, eventName, filter} = params;
  return new Promise((resolve, reject)=>{

    console.log("getEventLog options", params)
    contract.getPastEvents(eventName, {
      filter: filter,
      fromBlock,
      toBlock
    })
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
  
}

function saveTransfer(tableName, eventLogs){

  return new Promise((resolve, reject)=>{
    const bulk = mongo.getUnorderedBulkOp(tableName);

    eventLogs.forEach((log)=>{
      const {transactionHash, transactionIndex} = log;
      log._id = transactionHash;//`${eventLog.transactionHash}#${eventLog.transactionIndex}`;
      bulk.insert(log);
    })
    
    mongo.execute(bulk)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })
}
function saveWalletLogs(tableName, incomings){
  return new Promise((resolve, reject)=>{
    const bulk = mongo.getOrderedBulkOp(tableName);

    incomings.forEach((incoming)=>{
      const {transactionHash, address, from, to, value, type, factor, userId} = incoming;
      //const ether = web3.utils.fromWei(value, "ether");
      //console.log("saveWalletLogs", incoming)
      bulk.find({transactionHash: transactionHash}).upsert().updateOne({
        userId,
        address,
        type,
        from,
        to,
        factor,
        value: MongoWrapper.Decimal128.fromString(value + ""),
        transactionHash: transactionHash,
        created: Date.now()
      });
    })
    
    mongo.execute(bulk)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })
}

function getUser(ethAccount){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.USER, {ethAccount: ethAccount})
    .then((data)=>{
      resolve(data);
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