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

module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  getLatestWithdrawLog(tables.WALLET_WITHDRAW)
  .then((data)=>{
    //console.log("get latest log", data[0]);
    return data[0]?data[0].psnet.blockNumber + 1:1;
    
  })
  .then((blockNumber)=>{
    
    return getEventLog(DECK_CONTRACT, {
      fromBlock: blockNumber,
      toBlock: "latest",
      eventName: "allEvents"
    })
  })
  .then(async (eventLogs)=>{
    const sqsUrl = walletConfig.queueUrls.EVENT_WITHDRAW;
    const results = await sendSQS(region, sqsUrl, eventLogs);
    return eventLogs;
  })
  .then((eventLogs)=>{
    console.log("eventLogs", eventLogs.length);
    return saveWithdraw(tables.WALLET_WITHDRAW, eventLogs);
  })
 
  .then((data)=>{
    console.log(data);
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
        "psnet.blockNumber": -1
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
  const {fromBlock, toBlock, eventName} = params;
  return new Promise((resolve, reject)=>{

    console.log("getEventLog options", params)
    contract.getPastEvents(eventName, {
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

function saveWithdraw(tableName, eventLogs){

  return new Promise((resolve, reject)=>{
    const bulk = mongo.getUnorderedBulkOp(tableName);

    eventLogs.forEach((eventLog)=>{
      const {log, eventFunc, decoded} = eventLog;
      //bulk.find({_id: log._id }).upsert().updateOne(log);
      bulk.insert({_id: eventLog.id, psnet: eventLog});
    })
    
    //console.log("bulk", bulk);

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
    //const {log, decoded} = eventLog;
    //const {from, to, value} = decoded;
    return sqs.sendMessage(region, sqsUrl, JSON.stringify(eventLog));
    //return Promise.resolve(eventLog);
  })
  console.log("sent sqs message", results.length);
  return Promise.all(results);
  
}