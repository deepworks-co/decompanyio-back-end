'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');
const {buildContract} = require('../ContractUtils');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_BALLOT_ABI = require(`../../psnet/${stage}/Ballot.json`)
const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const PSNET_REGISTRY_ABI = require(`../../psnet/${stage}/Registry.json`)
const NETWORK_ID = walletConfig.psnet.id;

const DECK_CONTRACT = buildContract(web3, PSNET_DECK_ABI, NETWORK_ID);
const BALLOT_CONTRACT = buildContract(web3, PSNET_BALLOT_ABI, NETWORK_ID);
const REGISTRY_CONTRACT = buildContract(web3, PSNET_REGISTRY_ABI, NETWORK_ID);

module.exports.handler = async (event, context, callback) => {

  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }

  context.callbackWaitsForEmptyEventLoop = false;
  console.log("event", event)
  const {principalId} = event;
  try{
    const balance = await getBalance({principalId});

    if(!balance){
      throw new Error("[500] GetBalnace error");
    }

    const response = JSON.stringify({
      success: true, 
      balance: balance
    })
    
    return response;
  } catch(err){
    throw new Error(`[500] ${err}`);
  }
  
};


function getBalance(params) {

  const {principalId} = params;
 

  return new Promise((resolve, reject) =>{
    getWalletAccount(mongo, principalId)
    .then(async (account)=>{
      if(!account || !account.address){
        throw new Error("account is not exists");
      }
      const gasBalance = await web3.eth.getBalance(account.address);
      console.log(`${account.address} gas balance`, gasBalance);
  
      const deckBalance = await DECK_CONTRACT.methods.balanceOf(account.address).call();
      console.log(`${account.address} deck balance`, deckBalance);

      resolve({wei: gasBalance, deck: deckBalance})
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

