'use strict';
const {connectToDB, models} = require('decompany-mongoose')
const {VWDailyVote, VWDailyPageview, RewardPool, ClaimReward } = models;//require('decompany-mongoose').models
const {utils} = require('decompany-common-utils');
const {mongodb, applicationConfig} = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;
const Web3Utils = require('web3-utils');
const BigNumber = require('bignumber.js');
const conn = connectToDB(mongodb.endpoint);

module.exports.handler = async (event) => {

  const userId = event.principalId;
  const documentId = event.body.documentId;

  if(!userId || !documentId){
    throw new Error("parameter is not vaild")
  }

  const lastClaim = await ClaimReward.find({
    "_id.userId": userId,
    "_id.documentId": documentId,
  }).sort({_id: -1}).limit(1);

  const LAST_CLAIM = lastClaim[0] ? utils.getDate(lastClaim[0].voteDate, 1) : 0;
  console.log("LAST_CLAIM", LAST_CLAIM)

  const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
  const startDate = new Date(utils.getBlockchainTimestamp(new Date(LAST_CLAIM)))
  const endDate = utils.getDate(new Date(), -1 * (ACTIVE_VOTE_DAYS - 1));
  
  const start = utils.getBlockchainTimestamp(startDate);
  const end = utils.getBlockchainTimestamp(endDate);
  console.log('start, end', ACTIVE_VOTE_DAYS, new Date(start), new Date(end))

  const myVoteList = await VWDailyVote.find({blockchainTimestamp: {$gte: start, $lt: end}, userId: userId}).sort({blockchainTimestamp: 1});
  
  const myVoteMatrix = await getDailyMyVoteMatrix({myVoteList, startDate, endDate, nowDate});
  //console.log("myVoteMatrix", JSON.stringify(myVoteMatrix));

  const totalVoteMap = await getDailyTotalVoteMap({
    start: utils.getBlockchainTimestamp(utils.getDate(startDate, -1 * ACTIVE_VOTE_DAYS)), 
    end: utils.getBlockchainTimestamp(utils.getDate(new Date(), ACTIVE_VOTE_DAYS)), 
    myVoteList
  });
  //console.log('totalVoteMap', JSON.stringify(totalVoteMap))

  const rewardPoolList = await RewardPool.find({});
  
  const calcRewardMatrixResult = await calcRewardMatrix({myVoteMatrix, totalVoteMap, rewardPoolList})

  //console.log("calcRewardMatrixResult", JSON.stringify(calcRewardMatrixResult));
  const resultList = [].concat.apply([], calcRewardMatrixResult);
  return JSON.stringify({
      success: true,
      resultList: resultList.map((it)=> {
      return {
        documentId: it.documentId,
        userId: it.userId,
        voteDate: it.voteDate,
        activeDate: it.activeDate,
        reward: it.reward
      }
    })
  })
}

/**
 * 
 * @param {*} rewardPoolList 
 * @param {*} curDate 
 */
function getRewardPool(rewardPoolList, curDate){
  
  const r = rewardPoolList.find((it)=>{
    const {start, end} = it._id;
    if(start <= curDate && end>curDate){
      return true;
    } else {
      return false;
    }
   
  })
  return r;
}

/**
 * 
 * @param {*} param0 
 */
async function getDailyTotalVoteMap({start, end, myVoteList}){
  
  const myDocList = myVoteList.map((it)=>{
    return it.documentId;
  })
  
  const totalVoteList = await VWDailyVote.aggregate([{
    $match: {
      blockchainTimestamp: {$gte: start, $lt: end}
    }
  }, {
    $group: {
      _id: {blockchainTimestamp: "$blockchainTimestamp", documentId: "$documentId"},
      documentId: {$last: "$documentId"},
      blockchainTimestamp: {$last: "$blockchainTimestamp"},
      totalVoteAmount: {$sum: "$totalDeposit"}
    }
  }]);

  const totalVoteMatrix = totalVoteList.map((totalVote)=>{

    const {blockchainTimestamp, documentId} = totalVote._id;
    const voteDate = new Date(blockchainTimestamp);
    const {totalVoteAmount} = totalVote;

    return Array(ACTIVE_VOTE_DAYS).fill(0).map((it, index)=>{
      const activeDate = utils.getDate(voteDate, index);
      return {
        documentId,
        voteDate: voteDate,
        activeTimestamp: utils.getBlockchainTimestamp(activeDate),
        activeDate,
        totalVoteAmount
      }
    })
    
  })
  
  
  let mergedList = [].concat.apply([], totalVoteMatrix);
  const totalVoteMap = {}
  mergedList.forEach((vote)=>{
    const { documentId, activeTimestamp, totalVoteAmount} = vote;
    
    if(!totalVoteMap[documentId]){
      totalVoteMap[documentId] = {}
    }

    if(totalVoteMap[documentId][activeTimestamp + ""]){
      totalVoteMap[documentId][activeTimestamp + ""] = totalVoteMap[documentId][activeTimestamp + ""].plus(new BigNumber(totalVoteAmount));
    } else {
      totalVoteMap[documentId][activeTimestamp + ""] = new BigNumber(totalVoteAmount);
    }
  
  });

  return totalVoteMap;
}

/**
 * 
 * @param {*} param0 
 */
async function getDailyMyVoteMatrix({ myVoteList, startDate, endDate, nowDate }){
    
  const myVoteMatrix = myVoteList.map((myVote)=>{
    //console.log("myVote", JSON.stringify(myVote));
    const {blockchainTimestamp} = myVote._id;
    const voteDate = new Date(blockchainTimestamp);

    return Array(ACTIVE_VOTE_DAYS).fill(0).map((it, index)=>{
      const activeDate = utils.getDate(voteDate, index);
      const {userId, documentId, totalDeposit} = myVote;
      
      return {
        userId,
        documentId,
        voteDate,
        activeTimestamp: utils.getBlockchainTimestamp(activeDate),
        activeDate,
        totalDeposit
      }
    })
  })

  return myVoteMatrix;
}

/**
 * 
 * @param {*} param0 
 */
async function calcRewardMatrix({myVoteMatrix, totalVoteMap, rewardPoolList}){
  const resultList = await Promise.all(myVoteMatrix.map(async (myVoteList)=>{
    return calcRewardList({myVoteList, rewardPoolList, totalVoteMap});
  }));

  return resultList;
  
}

/**
 * 
 * @param {*} param0 
 */
async function calcRewardList({myVoteList, totalVoteMap, rewardPoolList}) {

  //console.log("calcRewardList.myVoteList", JSON.stringify(myVoteList));
  const resultList = await Promise.all(myVoteList.map(async (myVote)=>{
   
    const {voteDate, activeTimestamp, userId, documentId} = myVote;
  
    const rewardPool = getRewardPool(rewardPoolList, activeTimestamp);

    const pageviewInfo = await getPageview({documentId, blockchainTimestamp: activeTimestamp});

    const totalVote = totalVoteMap[documentId][activeTimestamp];
    let reward = -1;
    if(rewardPool){
      reward = utils.calcReward({
        pageview: pageviewInfo && pageviewInfo.pageview?pageviewInfo.pageview:0, 
        totalPageviewSquare: pageviewInfo&& pageviewInfo.totalPageviewSquare?pageviewInfo.totalPageviewSquare:0, 
        myVoteAmount: Web3Utils.fromWei(myVote.totalDeposit.toString(), 'ether'),
        totalVoteAmount: Web3Utils.fromWei(totalVote.toString(), 'ether'), 
        curatorDailyReward: rewardPool.curatorDailyReward
      });
    } 

    //console.log("calcRewardList", JSON.stringify({myVote, pageviewInfo, rewardPool, reward}))

    return {
      userId: userId,
      documentId: documentId,
      voteDate: voteDate,
      activeDate: new Date(activeTimestamp),
      activeTimestamp: activeTimestamp,
      pageview: pageviewInfo && pageviewInfo.pageview?pageviewInfo.pageview:0, 
      totalPageviewSquare: pageviewInfo&& pageviewInfo.totalPageviewSquare?pageviewInfo.totalPageviewSquare:0,
      myVoteAmount: Web3Utils.fromWei(myVote.totalDeposit.toString(), 'ether'),
      totalVoteAmount: Web3Utils.fromWei(totalVote.toString(), 'ether'), 
      reward: reward
    };
  }));

  return resultList;
}

async function getPageview({documentId, blockchainTimestamp}) {
  const resultList = await VWDailyPageview.find({documentId: documentId, blockchainTimestamp: blockchainTimestamp});

  return resultList[0];
  
}

const dateAgo = timestamp => {
  let currentDate = Number(new Date());
  let lastDate = Number(new Date(timestamp));
  return Math.floor((currentDate - lastDate) / (60 * 60 * 24 * 1000));
};