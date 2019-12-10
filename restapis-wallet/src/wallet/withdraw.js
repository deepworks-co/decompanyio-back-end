'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {sqs, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');



const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const NETWORK_ID = walletConfig.psnet.id;
const CONTRACT_ADDRESS = PSNET_DECK_ABI.networks[NETWORK_ID].address;
const DECK_CONTRACT = new web3.eth.Contract(PSNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;

module.exports.handler = async (event, context, callback) => {

  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }


  const {principalId, body} = event;
  const {amount} = body;

  try{

    if(!amount || isNaN(amount)){
      throw new Error("[500] parameter is invalid!!");
    }

    const checkPendingRequest = await checkPendingRequestWithdraw(principalId)
    if(checkPendingRequest === true){
      return JSON.stringify({
        success: false,
        message: "There are currently withdrawal requests pending."
      })
    }

    const user = await getUser(principalId);

    const balance = await getBalance(principalId);
    
    const balanceDeck = web3.utils.fromWei(balance + "", "ether");
    console.log("balance", balance, balanceDeck);
    if(amount>balanceDeck){
      return JSON.stringify({
        success: false,
        message: "You have run out of balance."
      })
    }

    const value = web3.utils.toWei(amount + "", "ether");
    const savedRequest = await saveRequestWithdrawToMongoDB({
      userId: principalId,
      address: user.ethAccount,
      value: value,
      status: "PENDING",
      created: Date.now()
    });

    console.log("savedRequest", savedRequest);
    const sqsUrl = walletConfig.queueUrls.EVENT_WITHDRAW;
    await sendWithdrawSQS(region, sqsUrl, savedRequest);
    
    return JSON.stringify({
      success: true,
      id: savedRequest._id
    })

  } catch (err){
    console.error(err);
    throw new Error(`[500] ${err.toString()}`);
  }

};

function sendWithdrawSQS(region, sqsUrl, params) {
  return new Promise((resolve, reject)=>{
    sqs.sendMessage(region, sqsUrl, JSON.stringify(params)).then((data)=>resolve(data))
    .catch((err)=>reject(err));
  })
}


function getUser(userId) {

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.USER, {_id: userId})
    .then((data)=>{
      if(data) resolve(data);
      else reject(new Error(`${userId} is not exists`));
    })
    .catch((err)=>{
      reject(err);
    })
  })
}


function saveRequestWithdrawToMongoDB(params){
  return new Promise((resolve, reject)=>{
    mongo.insert(tables.WALLET_REQUEST_WITHDRAW, params)
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function checkPendingRequestWithdraw(userId){
  return new Promise((resolve, reject)=>{
    mongo.find(tables.WALLET_REQUEST_WITHDRAW, {
      query: {
        userId: userId,
        status: "PENDING"
      }
    })
    .then((data)=>{
      console.log(data);
      if(data && data.length>0){
        resolve(true);
      } else {
        resolve(false);
      }
      
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function getBalance(userId) {
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.VW_WALLET_BALANCE, {_id: userId})
    .then((data)=>{
      const balance = data&&data.balance?data.balance.toString():0;
      resolve(balance);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}