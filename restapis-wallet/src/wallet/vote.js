'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper, utils} = require("decompany-common-utils");
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


  const {principalId, body} = event;
  const {documentId, amount} = body;

  try{

    const user = await getUser(principalId);

    if(!user){
      throw new Error(`[500] User is not found`);
    }

    const doc = await getDocument(documentId);
    if(!doc){
      throw new Error(`[500] document does not exists. document id ${documentId}`);
    }
    
    const voteAmount = Number(web3.utils.toWei(amount + "", "ether"));

    const deckBalance = await getBalance(user._id);

    if(voteAmount > deckBalance){
      throw new Error(`The Vote value has exceeded the current deck value.${voteAmount}/${deckBalance}`);
    }

    const created = Date.now();
    const savedVote = await saveVote({
      documentId: documentId, 
      userId: user._id, 
      deposit: MongoWrapper.Decimal128.fromString(voteAmount + ""),
      blockchainTimestamp: utils.getBlockchainTimestamp(created),
      created: created
    });
    console.log("saveVote", savedVote)
    
    const savedWallet = await saveWallet({
      userId: user._id,
      type: "VOTE",
      factor: -1,
      value: MongoWrapper.Decimal128.fromString(voteAmount + ""),
      voteId: savedVote._id,
      created: created
    });
    console.log("saveWallet", savedWallet);

    return JSON.stringify({
      success: true
    })

  } catch (err){
    console.error(err);
    throw new Error(`[500] ${err.toString()}`);
  }

};


function getUser(userId){

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

function saveWallet(params) {
  return new Promise(async (resolve, reject)=>{

    mongo.save(tables.WALLET, params).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

/**
 * @name saveVoteToMongoDB
 * @param {string} documentId document Id
 * @param {string} userId sns id
 * @param {number} value input value * e-18
 */
function saveVote(params){

  return new Promise(async (resolve, reject)=>{

    mongo.insert(tables.VOTE, params).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })

  })
}

function getDocument(documentId) {
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{
      
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
    
  })
}

function getBalance(userId) {
  return new Promise(async (resolve, reject)=>{
    try{
      const vwBalance = await mongo.findOne(tables.VW_WALLET_BALANCE, {_id: userId});
      let balance = vwBalance&&vwBalance.balance?vwBalance.balance.toString():0;
      
      resolve(balance);
    } catch(err){
      reject(err);
    }    
  })
}