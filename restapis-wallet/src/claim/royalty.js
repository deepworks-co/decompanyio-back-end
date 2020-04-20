'use strict';
const {stage, mongodb, tables, region, walletConfig, applicationConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper, utils} = require("decompany-common-utils");
const Web3 = require('web3');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);


module.exports.handler = async (event) => {
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
  
    const start = lastClaim&&lastClaim._id&&lastClaim._id.blockchainTimestamp?utils.getDate(new Date(lastClaim._id.blockchainTimestamp), 1):new Date(0); //마지막 claim에서 다음날부터 claim요청함
    const end = new Date();
    const pageviews = await getPageviewList(documentId, utils.getBlockchainTimestamp(start), utils.getBlockchainTimestamp(utils.getDate(end, -1)));
    //console.log("pageviews", JSON.stringify(pageviews));

    const calcRoyaltiesResult = await calcRoyalties({
      documentId, 
      userId: principalId, 
      pageviews
    })
    console.log("calcRoyaltiesResult", JSON.stringify(calcRoyaltiesResult));

    const saveRoyaltiesResult = await saveRoyalties({
      documentId, 
      userId: principalId, 
      pageviews,
      royalties: calcRoyaltiesResult
    });
  
    //console.log("saveRoyaltiesResult", JSON.stringify(saveRoyaltiesResult));
    return JSON.stringify({
      success: true,
      royalties: saveRoyaltiesResult.map((it)=>{
        return {
          _id: it._id,
          value: it.value.toString()
        }
      })
    })
  } catch (err){
    console.error(err);
    throw new Error(`[500] ${err.toString()}`);
  }

};

/**
 * 
 * @param {*} param0 
 */
async function calcRoyalties({pageviews, userId, documentId}) {

  const pageviewWithRewardPromises = pageviews.map(async (pageviewInfo)=>{
    const {pageview, blockchainTimestamp, totalpageviewInfo, rewardPoolInfo} = pageviewInfo;
    const reward = await calcRoyalty({
      blockchainTimestamp: blockchainTimestamp,
      pageview: pageview,
      totalPageview: totalpageviewInfo?totalpageviewInfo.totalPageview:0,
      creatorDailyReward: rewardPoolInfo?rewardPoolInfo.creatorDailyReward:0
    });

    return {
      _id: {
        documentId: documentId,
        userId: userId, 
        blockchainTimestamp: pageviewInfo.blockchainTimestamp
      },
      value: reward
    }
  })
  const pageviewWithReward = await Promise.all(pageviewWithRewardPromises);
  
  return pageviewWithReward;
}

/**
 * 
 * @param {*} param0 
 */
async function calcRoyalty({totalPageview, pageview, creatorDailyReward}){
  let reward = 0;
  if(creatorDailyReward){
    reward = utils.calcRoyalty({totalPageview, pageview, creatorDailyReward});
  }
   
  return reward;
}


/**
 * 
 * @param {*} documentId 
 */
function getDocument(documentId){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

/**
 * 
 * @param {*} documentId 
 * @param {*} startTimestamp 
 * @param {*} endTimestamp 
 */
function getPageviewList(documentId, startTimestamp, endTimestamp){
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
      $lookup: {
        from: tables.REWARD_POOL_DAILY,
        localField: 'blockchainTimestamp',
        foreignField: '_id',
        as: 'rewardPoolInfo'
      }
    }, {
      $unwind: {
        path: "$totalpageviewInfo",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $unwind: {
        path: "$rewardPoolInfo",
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

/**
 * 
 * @param {*} param0 
 */
async function saveRoyalties({documentId, userId, pageviews, royalties}){
  //save
  const savePromises = royalties.map(async (it)=>{

    const saveClaimRoyalty = await mongo.save(tables.CLAIM_ROYALTY, {
      _id: it._id,
      value: MongoWrapper.Decimal128.fromString(it.value + ""),
      created: Date.now()
    });


    const saveWalletResult = await mongo.save(tables.WALLET, {
      userId: userId,
      type: "ROYALTY",
      factor: 1,
      value: MongoWrapper.Decimal128.fromString(web3.utils.toWei(it.value + "", "ether")),
      claimRoyalty: saveClaimRoyalty,
      created: Date.now()
    });

    return it;
  })
  const saveRoyaltiesResult = await Promise.all(savePromises);
  
  return saveRoyaltiesResult;
}