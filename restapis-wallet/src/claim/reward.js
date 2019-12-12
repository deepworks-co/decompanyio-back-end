'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper, utils} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');
const {buildContract} = require('../ContractUtils');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);
/*
const PSNET_BALLOT_ABI = require(`../../psnet/${stage}/Ballot.json`)
const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const PSNET_REGISTRY_ABI = require(`../../psnet/${stage}/Registry.json`)
const NETWORK_ID = walletConfig.psnet.id;

const DECK_CONTRACT = buildContract(web3, PSNET_DECK_ABI, NETWORK_ID);
const BALLOT_CONTRACT = buildContract(web3, PSNET_BALLOT_ABI, NETWORK_ID);
const REGISTRY_CONTRACT = buildContract(web3, PSNET_REGISTRY_ABI, NETWORK_ID);
*/
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
    const lastClaim = await getLastClaimReward({
      documentId: documentId,
      userId: principalId
    });
    console.log("lastClaim", lastClaim);
    const start = lastClaim&&lastClaim.created?new Date(lastClaim.created + (1000 * 60 * 60 * 24)):new Date(0); //마지막 claim에서 다음날부터 claim요청함
    const end = new Date();

    const dailyMyVoteList = await getDailyMyVoteList(documentId, principalId, utils.getBlockchainTimestamp(start), utils.getBlockchainTimestamp(end));
    //console.log("dailyMyVoteList", dailyMyVoteList);

    const dailyPageviewMap = await getDailyPageviewMap(documentId, utils.getBlockchainTimestamp(start), utils.getBlockchainTimestamp(end));
    //console.log("dailyPageviewMap", dailyPageviewMap)

    const dailyVoteMap = await getDailyVoteMap(documentId, utils.getBlockchainTimestamp(start), utils.getBlockchainTimestamp(end));
    //console.log("dailyVoteMap", dailyVoteMap)
    
       

    const votesWithRewardPromises = dailyMyVoteList.map(async (myVote)=>{
      
      const {voteAmount, _id} = myVote;
      const blockchainDate = new Date(_id);
      const year = blockchainDate.getUTCFullYear();
      const month = blockchainDate.getUTCMonth() + 1;
      const dayOfMonth = blockchainDate.getUTCDate();
      const rewardPool = await getRewardPool(blockchainDate);

      const returnValue = {
        _id: {
          year: year, 
          month: month, 
          dayOfMonth: dayOfMonth, 
          userId: principalId, 
          documentId: documentId
        }, 
        blockchainTimestamp: _id, 
        voteAmount: voteAmount,
        value: MongoWrapper.Decimal128.fromString("0"),
        created: Date.now()
      }

      if(rewardPool && isNaN(voteAmount) === false && voteAmount>0){

        const {pageview, totalPageviewSquare} = dailyPageviewMap[_id];
        //decimal -> string of number
        const totalVoteAmount = web3.utils.fromWei(dailyVoteMap[_id] + "", "ether");
        const myVoteAmount = web3.utils.fromWei(voteAmount.toString(), "ether");
        
        returnValue.value = calcReward({
          pageview: pageview,
          totalPageviewSquare: totalPageviewSquare,
          myVoteAmount: myVoteAmount,
          totalVoteAmount: totalVoteAmount,
          curatorDailyReward: rewardPool.curatorDailyReward
        });
      } 
      
      return returnValue;
    })
    const votesWithReward = await Promise.all(votesWithRewardPromises);
    console.log("reward", votesWithReward);

    //save
    const savePromises = votesWithReward.filter((it)=>{
      if(it.value)
        return true;
      else
        return false;
    }).map(async (it)=>{
      
      await saveClaimReward(it);
      await saveWallet({rewardId: it._id, value: it.value});

      return it;
    })
    const savePromisesComplete = await Promise.all(savePromises);

    console.log("save royalty claim", savePromisesComplete);

    return JSON.stringify({
      success: true, 
      rewards: votesWithReward.map((it)=>{
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

function getDocument(documentId){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

async function getDailyVoteMap(documentId, startTimestamp, endTimestamp){

  const voteList = await mongo.aggregate(tables.VOTE, [{
      $match: {
          documentId: documentId,
          $and: [
            {blockchainTimestamp: {$gte: startTimestamp}}, 
            {blockchainTimestamp: {$lt: endTimestamp}}
          ]
      }
  }, {
      $group: {
          _id: "$blockchainTimestamp",
          voteAmount: {
              $sum: "$deposit"
          },
          created: {
              $last: "$created"
          }
      }
  }, {
      $lookup: {
          from: tables.STAT_PAGEVIEW_DAILY,
          localField: 'blockchainTimestamp',
          foreignField: 'blockchainTimestamp',
          as: 'pageview'
      }
  }])

  const voteMap = {};

  voteList.forEach((vote)=>{
    voteMap[vote._id] = vote.voteAmount;
  })

  return voteMap;

}

function getDailyMyVoteList(documentId, userId, startTimestamp, endTimestamp){
  
  return new Promise((resolve, reject)=>{
    mongo.aggregate(tables.VOTE, [
      {
        $match: {
          documentId: documentId,
          userId: userId,
          $and: [
            {blockchainTimestamp: {$gte: startTimestamp}}, 
            {blockchainTimestamp: {$lt: endTimestamp}}
          ]
        }
      }, {
        $group: {
          _id: '$blockchainTimestamp', 
          voteAmount: {
            '$sum': '$deposit'
          }, 
          created: {
            '$last': '$created'
          }
        }
      }
    ]).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

async function getDailyPageviewMap(documentId, startTimestamp, endTimestamp){

  const pageviewList = await mongo.aggregate(tables.STAT_PAGEVIEW_DAILY, [
    {
      '$match': {
        'documentId': documentId, 
        '$and': [
          {
            'blockchainTimestamp': {
              '$gte': startTimestamp
            }
          }, {
            'blockchainTimestamp': {
              '$lt': endTimestamp
            }
          }
        ]
      }
    }, {
      '$lookup': {
        'from': 'STAT-PAGEVIEW-TOTALCOUNT-DAILY', 
        'localField': 'blockchainTimestamp', 
        'foreignField': 'blockchainTimestamp', 
        'as': 'totalpageview'
      }
    }, {
      '$unwind': {
        'path': '$totalpageview', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$project': {
        '_id': 1, 
        'blockchainTimestamp': 1, 
        'documentId': 1, 
        'pageview': 1, 
        'totalPageview': '$totalpageview.totalPageview', 
        'totalPageviewSquare': '$totalpageview.totalPageviewSquare'
      }
    }
  ])

  const pageviewMap = {}
  pageviewList.forEach((it)=>{
    pageviewMap[it.blockchainTimestamp] = it;
  })

  return pageviewMap;

}

function calcReward(args){
  //console.log("calcReward", args);
  const {pageview, totalPageviewSquare, myVoteAmount, totalVoteAmount, curatorDailyReward} = args;
  if(!pageview || !totalPageviewSquare || !myVoteAmount || !totalVoteAmount || !curatorDailyReward){
    throw new Error(`args is invalid : ${JSON.stringify(args)}`)
  }

  let reward = ((Math.pow(pageview, 2) / totalPageviewSquare)) * ( myVoteAmount / totalVoteAmount ) * curatorDailyReward;

  reward  = Math.floor(reward * 100000) / 100000;
  const strValue = web3.utils.toWei(reward + "", "ether");

  return MongoWrapper.Decimal128.fromString(strValue);
}
/**
 * 
 * @param {*} params 
 */
function saveClaimReward(params){
  return new Promise(async (resolve, reject)=>{
    mongo.save(tables.CLAIM_REWARD, {
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

function saveWallet({rewardId, value}){

  return new Promise(async (resolve, reject)=>{
    mongo.save(tables.WALLET, {
      userId: rewardId.userId,
      type: "REWARD",
      factor: 1,
      value ,
      royaltyId: rewardId,
      created: Date.now()
    }).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    });
  });
}


/**
 * @name getLastClaimReward
 * @param {*} params 
 */
function getLastClaimReward(params){
  const {documentId, userId} = params
  return new Promise(async (resolve, reject)=>{

    try{
      const claimList = await mongo.find(tables.CLAIM_REWARD, {
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