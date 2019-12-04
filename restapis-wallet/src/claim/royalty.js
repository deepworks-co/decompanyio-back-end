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
  //context.callbackWaitsForEmptyEventLoop = false;
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }


  const {principalId, body} = event;
  const {documentId} = body;

  try{

    const doc = await getDocument(documentId);

    if(!doc){
      throw new Error(`${documentId} is not registry!`);
    }

    if(doc.accountId !== principalId){
      throw new Error(`You are not the owner of the document. : ${doc.title}`);
    }
    const lastClaim = await getLastClaimRoyalty({
      documentId: documentId,
      userId: principalId
    });
    console.log("lastClaim", lastClaim);
    const start = lastClaim&&lastClaim.created?new Date(lastClaim.created + (1000 * 60 * 60 * 24)):new Date(0); //마지막 claim에서 다음날부터 claim요청함
    const end = new Date();
    const pageviews = await getPageview(documentId, utils.getBlockchainTimestamp(start), utils.getBlockchainTimestamp(end));
    
    const pageviewWithRewardPromises = pageviews.map(async (pageviewInfo)=>{

      const reward = await calcReward({
        year: pageviewInfo._id.year,
        month: pageviewInfo._id.month,
        dayOfMonth: pageviewInfo._id.dayOfMonth,
        blockchainTimestamp: pageviewInfo.blockchainTimestamp,
        principalId, 
        documentId,
        pageview: pageviewInfo.pageview,
        totalPageview: pageviewInfo.totalpageviewInfo.totalPageview
      });

      return {
        _id: {
          year: pageviewInfo._id.year, 
          month: pageviewInfo._id.month, 
          dayOfMonth: pageviewInfo._id.dayOfMonth, 
          userId: principalId, 
          documentId: documentId
        }, 
        blockchainTimestamp: pageviewInfo.blockchainTimestamp, 
        value: reward
      }
    })
    const pageviewWithReward = await Promise.all(pageviewWithRewardPromises);
    console.log("royalties", pageviewWithReward);
    
    //save
    const savePromises = pageviewWithReward.filter((it)=>{
      if(it.value)
        return true;
      else
        return false;
    }).map(async (it)=>{

      await saveClaimReward(it);
      await saveWallet({royaltyId: it._id, value: it.value});

      return it;
    })
    const savePromisesComplete = await Promise.all(savePromises);

    console.log("save royalty claim", savePromisesComplete);

    return JSON.stringify({
      success: true,
      royalties: pageviewWithReward.map((it)=>{
        return {
          _id: it._id,
          blockchainTimestamp: it.blockchainTimestamp,
          value: it.value.toString()
        }
      })
    })
  } catch (err){
    console.error(err);
    throw new Error(`[500] ${err.toString()}`);
  }

};

async function calcReward(args){

  const {totalPageview, pageview, year, month, dayOfMonth, blockchainTimestamp} = args;
  const date = new Date(Date.UTC(year, month-1, dayOfMonth));
  const rewardPool = await getRewardPool(date);
  let reward = 0;
  
  if(rewardPool){
    //console.log("calcReward : ", JSON.stringify(_id), stat.pageview, totalpageview.totalPageview, rewardPool.creatorDailyReward);

    let royalty = (pageview / totalPageview)  * rewardPool.creatorDailyReward;
    royalty  = Math.floor(royalty * 100000) / 100000;
    const strValue = web3.utils.toWei(royalty + "", "ether");

    reward = MongoWrapper.Decimal128.fromString(strValue);
  } else {
    //console.log("calcReward : 0");
    reward = MongoWrapper.Decimal128.fromString("0");
  }
  
  return reward;
}

function getDocument(documentId){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

function getPageview(documentId, startTimestamp, endTimestamp){
  return new Promise((resolve, reject)=>{
    mongo.aggregate(tables.STAT_PAGEVIEW_DAILY, [{
      $match: {
        documentId: documentId,
        $and: [
          {blockchainTimestamp: {$gte: startTimestamp}}, 
          {blockchainTimestamp: {$lt: endTimestamp}}
        ]
      },
    }, {
      $lookup: {
        from: tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY,
        localField: 'blockchainTimestamp',
        foreignField: 'blockchainTimestamp',
        as: 'totalpageviewInfo'
      }
    }, {
      $unwind: {
        path: "$totalpageviewInfo",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $sort: {_id: 1}
    }]).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}


/**
 * 
 * @param {*} params 
 */
function saveClaimReward(params){
  return new Promise(async (resolve, reject)=>{
    mongo.save(tables.CLAIM_ROYALTY, {
      _id: params._id,
      blockchainTimestamp: params.blockchainTimestamp,
      value: params.value,
      created: Date.now()
    }).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    });
  });
}

function saveWallet({royaltyId, value}){

  return new Promise(async (resolve, reject)=>{
    mongo.save(tables.WALLET, {
      userId: royaltyId.userId,
      type: "ROYALTY",
      factor: 1,
      value ,
      royaltyId: royaltyId,
      created: Date.now()
    }).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    });
  });
}


/**
 * @name getLastClaimRoyalty
 * @param {*} params 
 */
function getLastClaimRoyalty(params){
  const {documentId, userId} = params
  return new Promise(async (resolve, reject)=>{

    try{
      const claimList = await mongo.find(tables.CLAIM_ROYALTY, {
        query: {
          "_id.userId": userId,
          "_id.documentId": documentId
        }, 
        sort: {
          _id: -1
        },
        limit: 1
      })

      resolve(claimList[0]);
    } catch(err){
      reject(err);
    }
    
  });
}

function getRewardPool(date){
 
  return new Promise((resolve, reject)=>{
    mongo.find(tables.REWARD_POOL, {
      query: {
        "_id.start": {$lte: date}, "_id.end": {$gt: date}
      }
    }).then((data)=>{
      if(data && data.length>0){
        resolve(data[0]);
      } else {
        resolve(null);
      }
      
    }).catch((err)=>{
      reject(err);
    })
  })
}