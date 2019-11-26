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

  //context.callbackWaitsForEmptyEventLoop = false;
  //console.log("mongo status", JSON.stringify(mongo.status()));
  const {userId} = event.body;
  try{
    const user = await getUser(mongo, userId);
    if(!user){
      throw new Error("user id is invaild!!");
    }
    
    if(!user.ethAccount){
      const response = JSON.stringify({
        success: false, 
        message: "There is no registered account(EOA)."
      })
  
      return response;
    }

    const balance = await getBalance(mongo, user.ethAccount);
    console.log("balance", balance)
    const response = JSON.stringify({
      success: true, 
      balance: balance
    })
    
    return response;
  } catch(err){
    console.error(err);
    throw new Error(`[500] ${err}`);
  }
  
};

function getUser(mongo, userId) {
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.USER, {_id: userId})
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}

function getBalance(mongo, ethAccount) {
  return new Promise(async (resolve, reject)=>{
    try{
      const vwBalance = await mongo.findOne(tables.VW_WALLET_BALANCE, {_id: ethAccount});
      console.log(vwBalance);
      let balance = 0;
      if(vwBalance){
        balance = vwBalance&&vwBalance.balance?vwBalance.balance.toString():0;

        const lastBalance = await mongo.aggregate(tables.WALLET, [
        {
          $match:{ 
            _id: ethAccount,
            created: {$gt: vwBalance.created}
          }
        }, {
          $group: {
            _id: "$account",
            balance: {
                "$sum": {
                    "$multiply": ["$value", "$factor"]
                }
            }
          }
        }]);
        console.log(lastBalance);

      } else {
        balance = 0;
      }

      resolve(balance);
    } catch(err){
      reject(err);
    }    
  })
}
