'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {sqs, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const PSNET_ID = walletConfig.psnet.id;
const CONTRACT_ADDRESS = PSNET_DECK_ABI.networks[PSNET_ID].address;
const DECK_CONTRACT = new web3.eth.Contract(PSNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;
/*
* psnet의 DECK 컨트렉트의 이벤트를 수집하고, 
* 출금(user->foundation) 이벤트일 경우 SQS를 보내어 /src/sqs/withdraw 람다 함수를 호출한다.
*/
module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  getLatestWithdrawLog(tables.WALLET_WITHDRAW)
  .then((data)=>{
    console.log("get latest log", data[0]);
    return data[0]?data[0].log.blockNumber + 1:1;
  })
  .then(async (blockNumber)=>{
    const foundation = await getWalletAccount(FOUNDATION_ID);
    return getEventLog(DECK_CONTRACT, {
      fromBlock: blockNumber,
      toBlock: "latest",
      eventName: "Transfer",
      filter: [foundation.address]
    })
  })
  .then((eventLogs)=>{
    //console.log("eventLogs count", eventLogs);
    return findWithdrawEvent(tables.WALLET_WITHDRAW, eventLogs);
  })
  .then(async (eventLogsWithFindItem)=>{
    console.log("find eventLogs count", eventLogsWithFindItem.length);
    const r = await saveWithdraw(tables.WALLET_WITHDRAW, eventLogsWithFindItem);
    console.log("saveWithdraw", r);
    return eventLogsWithFindItem;
  })
  .then(async (eventLogsWithFindItem)=>{
    console.log("getWithdrawEvent", eventLogsWithFindItem.length);
    const sqsUrl = walletConfig.queueUrls.EVENT_WITHDRAW;
    const results = await sendSQS(region, sqsUrl, eventLogsWithFindItem);
    return results;
  })
  .then((data)=>{
   
    callback(null, {
      success: true,
      data: data
    })
  })
  .catch((err)=>{
    callback(err);
  })
  
};

function getLatestWithdrawLog(tableName){
  return new Promise((resolve, reject)=>{
    mongo.find(tableName, {
      query: {
        log: {$exists: true}
      },
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
      fromBlock,
      toBlock,
      filter: filter
    })
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
  
}


function findWithdrawEvent(tableName, eventLogs){

  return new Promise(async (resolve, reject)=>{
    
    const filterResultPromise = eventLogs.map(async (eventLog)=>{
      const {transactionHash} = eventLog;
      
      const findItem = await mongo.findOne(tableName, { _id: transactionHash});
      
      if(findItem) {
        return {findItem, eventLog}
      }
      return {eventLog};

    });

    Promise.all(filterResultPromise)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err))    
  });

}

function saveWithdraw(tableName, eventLogsWithFindItem){

  return new Promise((resolve, reject)=>{
    const bulk = mongo.getUnorderedBulkOp(tableName);

    eventLogsWithFindItem.forEach((eventLogWithFindItem)=>{
      const {eventLog, findItem} = eventLogWithFindItem;
      const {transactionHash} = eventLog;      
      bulk.find({_id: transactionHash}).upsert().updateOne({$set: {log: eventLog, created: Date.now()}});
      if(findItem){
        bulk.find({_id: transactionHash}).upsert().updateOne({$set: {status: "EVENT_WITHDRAW", created: findItem.created, updated: Date.now()}});
      }
    })

    mongo.execute(bulk)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })

}

function sendSQS(region, sqsUrl, eventLogsWithFindItem) {
  const results = eventLogsWithFindItem.filter((eventLogWithFindItem)=>{
    const {eventLog, findItem} = eventLogWithFindItem;
    return findItem && findItem.toAddress
  })
  .map((eventLogWithFindItem)=>{
    const {eventLog, findItem} = eventLogWithFindItem;
    const {to, from , value} = eventLog.returnValues;
    return sqs.sendMessage(region, sqsUrl, JSON.stringify({
      fromAddress: findItem.fromAddress,
      toAddress: findItem.toAddress, 
      transactionHash: eventLog.transactionHash,
      value: value
    }));
  })
  console.log("sent sqs message", results.length);
  return Promise.all(results);
  
}

function getWithdrawEvent(eventLogs, foundationAddress){
  if(!foundationAddress){
    throw new Error("foundation address is undefined");
  }
  return eventLogs.filter((eventLog)=>{
    return eventLog.event === "Transfer"
  }).filter((eventLog)=>{
    
    const {returnValues} = eventLog;
    const {from, to, value} = returnValues;

    return to && to === foundationAddress
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