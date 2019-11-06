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
    //console.log("get latest log", data[0]);
    return data[0]?data[0].log.blockNumber + 1:1;
  })
  .then(async (blockNumber)=>{
    const foundation = await getWalletAccount(FOUNDATION_ID);
    return getEventLog(DECK_CONTRACT, {
      fromBlock: blockNumber,
      toBlock: "latest",
      eventName: "Transfer",
      filter: {to: foundation.address}
    })
  })
  .then(async (eventLogs)=>{
    console.log("eventLogs count", eventLogs.length);
    const r = await saveWithdraw(tables.WALLET_WITHDRAW, eventLogs);
    console.log("saveWithdraw", r);
    return eventLogs;
  })
  .then(async (eventLogs)=>{
    console.log("getWithdrawEvent", eventLogs.length);
    const sqsUrl = walletConfig.queueUrls.EVENT_WITHDRAW;
    const results = await sendSQS(region, sqsUrl, eventLogs);
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

function saveWithdraw(tableName, eventLogs){

  return new Promise((resolve, reject)=>{
    const bulk = mongo.getUnorderedBulkOp(tableName);

    eventLogs.forEach((eventLog)=>{
      const {transactionHash, transactionIndex} = eventLog;
      //bulk.find({_id: log._id }).upsert().updateOne(log);
      const id = `${transactionHash}#${transactionIndex}`;
      bulk.insert({_id: id, log: eventLog});
    })

    mongo.execute(bulk)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })

}

function sendSQS(region, sqsUrl, eventLogs) {
  const results = eventLogs.filter((eventLog)=>{
    return eventLog.event === "Transfer"
  })
  .map((eventLog)=>{
    return sqs.sendMessage(region, sqsUrl, JSON.stringify(eventLog));
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