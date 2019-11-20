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
/*
* mainnet의 DECK 컨트렉트의 이벤트를 수집하고, 
* 입금 이벤트일 경우 SQS를 보내어 /src/sqs/deposit를 람다 함수를 호출한다.
*/
module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  getLatestDepositLog(tables.WALLET_DEPOSIT)
  .then((data)=>{
    //console.log("get latest log", data[0]);
    return data[0]?data[0].log.blockNumber + 1:1;
  })
  .then(async (blockNumber)=>{
    
    return getEventLog(DECK_CONTRACT, {
      fromBlock: blockNumber,
      toBlock: "latest",
      eventName: "Transfer"
    })
  })
  .then(async (eventLogs)=>{
    console.log("eventLogs count", eventLogs.length);
    const checkedEventLogs = await checkDepositEvent(eventLogs);
    const r = await saveDeposit(tables.WALLET_DEPOSIT, checkedEventLogs);
    console.log("savewDeposit", r);
    return checkedEventLogs;
  })
  .then(async (checkedEventLogs)=>{
    console.log("getDepositEvent", checkedEventLogs.length);
    const sqsUrl = walletConfig.queueUrls.EVENT_DEPOSIT;
    const results = await sendSQS(region, sqsUrl, checkedEventLogs);
    return results;
  })
  .then((data)=>{
    console.log(data.length);
    callback(null, {
      success: true,
      data: data
    })
  })
  .catch((err)=>{
    callback(err);
  })
  
};

function getLatestDepositLog(tableName){
  return new Promise((resolve, reject)=>{
    mongo.find(tableName, {
      sort: {
        "log.blockNumber": -1
      },
      limit: 1      
    }).then((data)=>{
      resolve(data);
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

function saveDeposit(tableName, checkedEventLogs){

  return new Promise((resolve, reject)=>{
    const bulk = mongo.getUnorderedBulkOp(tableName);

    checkedEventLogs.forEach((checkedEventLog)=>{
      const {eventLog, deposit} = checkedEventLog;
      const {transactionHash, transactionIndex} = eventLog;
      const id = {transactionHash, transactionIndex};//`${eventLog.transactionHash}#${eventLog.transactionIndex}`;
      bulk.insert({_id: id, log: eventLog, deposit: deposit});
    })
    
    mongo.execute(bulk)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })

}

async function checkDepositEvent(eventLogs) {

  const results = eventLogs.map(async (eventLog)=>{    
    const {to} = eventLog.returnValues;
    const check = await isWalletUser(to)
    if(check === true){
      return {eventLog, deposit: true}
    }
    
    return {eventLog, deposit: false};
  });
  
  return await Promise.all(results);
  
}

function sendSQS(region, sqsUrl, checkedEventLogs) {
  const results = checkedEventLogs.map((checkedEventLog)=>{
    const {eventLog, deposit} = checkedEventLog;
    //const {log, decoded} = eventLog;
    //const {from, to, value} = decoded;
    if(deposit === true){
      return sqs.sendMessage(region, sqsUrl, JSON.stringify(eventLog));
    } else {
      return Promise.resolve(false);
    }
    
  })
  console.log("sent sqs message", results.length);
  return Promise.all(results);
  
}

function isWalletUser(address){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {_id: {$ne: FOUNDATION_ID}, address: address})
    .then((data)=>{
      if(data){
        resolve(true);
      } else{
        resolve(false);
      } 
    })
    .catch((err)=>{
      reject(err);
    })
  })
}