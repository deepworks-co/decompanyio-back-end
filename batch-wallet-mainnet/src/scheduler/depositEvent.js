'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {sqs, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const web3 = new Web3(walletConfig.mainnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const MAINNET_DECK_ABI = require(`../../mainnet/${stage}/Deck.json`)
const CONTRACT_ADDRESS = MAINNET_DECK_ABI.networks[walletConfig.mainnet.id].address;
const EVENT_SIGNATURES = getEventSignature(MAINNET_DECK_ABI.abi);
//console.log("EVENT_SIGNATURES", EVENT_SIGNATURES);
module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  getLatestDepositLog(tables.WALLET_DEPOSIT)
  .then((data)=>{
    //console.log("get latest log", data[0]);
    return 5346085
    //return data[0]?data[0].mainnet.log.blockNumber + 1:1;
    
  })
  .then((blockNumber)=>{
    console.log("start block number", blockNumber, "to latest");
    return getPastLog({
      fromBlock: blockNumber,
      toBlock: "latest",
      address: CONTRACT_ADDRESS,
      topics: []
    })
  })
  .then((pastLogs)=>{
    console.log("get past logs", pastLogs);
    const eventLogs = pastLogs.map((log)=>{
      const eventFunc = EVENT_SIGNATURES[log.topics[0]];
      const decoded = getDecodedLog(log, eventFunc.inputs, eventFunc.anonymous?log.topics.splice(0):log.topics.splice(1));
      return {log, eventFunc, decoded};
    })
    //console.log("eventLogs", eventLogs);
    return eventLogs;
  })
  .then(async (eventLogs)=>{
    const sqsUrl = walletConfig.queueUrls.EVENT_DEPOSIT;
    const results = await sendSQS(region, sqsUrl, eventLogs);
    return eventLogs;
  })
  .then((eventLogs)=>{
    return saveDeposit(tables.WALLET_DEPOSIT, eventLogs);
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

function getLatestDepositLog(tableName){
  return new Promise((resolve, reject)=>{
    mongo.find(tableName, {
      sort: {
        "mainnet.log.blockNumber": -1
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


function getPastLog(params) {
  return new Promise((resolve, reject)=>{
    const options = {
      fromBlock: params.fromBlock,
      toBlock: params.toBlock,
      address: params.address,
      topics: params.topics?params.topics:[]
    }

    console.log("getPastLog options", options);
    web3.eth.getPastLogs(options)
    .then((logs)=>{
      resolve(logs);
    })
    .catch((err)=>{
      reject(err);
    })
  })
  
}

function getEventSignature(abis) {
  const v = {}
  abis.forEach((abi)=>{
    
    if(abi.type === 'event') {
      v[abi.signature] = abi;
    }
    
  });
  return v;
}

function getDecodedLog(log, inputs, topics) {
  
  const decoded = web3.eth.abi.decodeLog(inputs, log.data, topics);
  
  return decoded;
}

function saveDeposit(tableName, eventLogs){

  return new Promise((resolve, reject)=>{
    const bulk = mongo.getUnorderedBulkOp(tableName);

    eventLogs.forEach((eventLog)=>{
      const {log, eventFunc, decoded} = eventLog;
      //bulk.find({_id: log._id }).upsert().updateOne(log);
      bulk.insert({_id: log.id, mainnet: eventLog});
    })
    
    //console.log("bulk", bulk);

    mongo.execute(bulk)
    .then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })

}

function sendSQS(region, sqsUrl, eventLogs) {
  const results = eventLogs
  .filter((eventLog)=>{
    const {eventFunc} = eventLog;
    return eventFunc.name === "Transfer" && eventFunc.type === 'event'
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