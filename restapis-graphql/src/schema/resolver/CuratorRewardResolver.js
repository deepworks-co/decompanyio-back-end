'use strict';
const {VWDailyVote, RewardPool} = require('../../mongoose/model')
const {utils} = require('decompany-common-utils');

module.exports = {
  getLast7CuratorReward,
  getTodayEstimatedCuratorReward
}

async function getLast7CuratorReward({userId}) {
  const endDate = new Date();
  const startDate = new Date().setDate(endDate.getDate() - 7); 

  const start = utils.getBlockchainTimestamp(startDate);
  const end = utils.getBlockchainTimestamp(endDate);

  const myVoteList = await VWDailyVote.find({blockchainTimestamp: {$gte: start, $lt: end}, userId: userId}).sort({blockchainTimestamp: -1});
  const myDocList = myVoteList.map((it)=>{
    return it.documentId;
  })

  const totalVoteList = await VWDailyVote.aggregate([{
    $match: {
      blockchainTimestamp: {$gte: start, $lt: end},
      documentId: {$in: myDocList}
    }
  }, {
    $group: {
      _id: {blockchainTimestamp: "$blockchainTimestamp", documentId: "$documentId"},
      documentId: {$last: "$documentId"},
      blockchainTimestamp: {$last: "$blockchainTimestamp"},
      totalVoteAmount: {$sum: "$totalDeposit"}
    }
  }]);

  const rewardPoolList = await RewardPool.find({});

  const resultList = await Promise.all(myVoteList.map(async (myVote)=>{

    const {blockchainTimestamp, userId, documentId} = myVote._id;
    const date = new Date(blockchainTimestamp);

    const rewardPool = getRewardPool(rewardPoolList, date);

    const totalVote = await getTotalVoteInfo(totalVoteList, myVote.blockchainTimestamp, myVote.documentId);
    let reward = -1;
    if(rewardPool){
      reward = calcReward({
        pageview: myVote.pageview, 
        totalPageviewSquare: myVote.totalPageviewSquare, 
        myVoteAmount: myVote.totalDeposit / 1000000000000000000, 
        totalVoteAmount: totalVote.totalVoteAmount/ 1000000000000000000, 
        curatorDailyReward: rewardPool.curatorDailyReward
      });
      
    } 

    return {
      userId: userId,
      documentId: documentId,
      blockchainDate: new Date(blockchainTimestamp),
      blockchainTimestamp: blockchainTimestamp,
      pageview: myVote.pageview,
      totalPageviewSquare: myVote.totalPageviewSquare,
      reward: reward
    };
  }));

  return resultList
}

async function getTodayEstimatedCuratorReward({userId}) {
  const now = new Date();
  const timestamp = utils.getBlockchainTimestamp(now);

  const myVoteList = await VWDailyVote.find({blockchainTimestamp: timestamp, userId: userId}).sort({blockchainTimestamp: -1});
  const myDocList = myVoteList.map((it)=>{
    return it.documentId;
  })

  if(myVoteList.length === 0){
    return null
  }

  const totalVoteList = await VWDailyVote.aggregate([{
    $match: {
      blockchainTimestamp: timestamp,
      documentId: {$in: myDocList}
    }
  }, {
    $group: {
      _id: {blockchainTimestamp: "$blockchainTimestamp", documentId: "$documentId"},
      documentId: {$last: "$documentId"},
      blockchainTimestamp: {$last: "$blockchainTimestamp"},
      totalVoteAmount: {$sum: "$totalDeposit"}
    }
  }]);

  const rewardPoolList = await RewardPool.find({});

  const resultList = await Promise.all(myVoteList.map(async (myVote)=>{

    const {blockchainTimestamp, userId, documentId} = myVote._id;
    const date = new Date(blockchainTimestamp);

    const rewardPool = getRewardPool(rewardPoolList, date);

    const totalVote = await getTotalVoteInfo(totalVoteList, myVote.blockchainTimestamp, myVote.documentId);
    let reward = -1;
    if(rewardPool){
      reward = calcReward({
        pageview: myVote.pageview, 
        totalPageviewSquare: myVote.totalPageviewSquare, 
        myVoteAmount: myVote.totalDeposit / 1000000000000000000, 
        totalVoteAmount: totalVote.totalVoteAmount/ 1000000000000000000, 
        curatorDailyReward: rewardPool.curatorDailyReward
      });
      
    } 

    return {
      userId: userId,
      documentId: documentId,
      blockchainDate: new Date(blockchainTimestamp),
      blockchainTimestamp: blockchainTimestamp,
      pageview: myVote.pageview,
      totalPageviewSquare: myVote.totalPageviewSquare,
      reward: reward
    };
  }));

  return resultList
}


function getTotalVoteInfo(totalVoteList, blockchainTimestamp, documentId){
  return totalVoteList.find((myVote)=>{
    return (documentId === myVote.documentId && blockchainTimestamp === myVote.blockchainTimestamp)
  })
}

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
 * @param {pageview, totalPageviewSquare, myVoteAmount, totalVoteAmount, curatorDailyReward} args 
 */
function calcReward(args){
    console.log("args", args);
  const {pageview, totalPageviewSquare, myVoteAmount, totalVoteAmount, curatorDailyReward} = args;
  if(isNaN(pageview) || isNaN(totalPageviewSquare) || isNaN(myVoteAmount) || isNaN(totalVoteAmount) || isNaN(curatorDailyReward)){
    return -1;
  }

  let reward = ((Math.pow(pageview, 2) / totalPageviewSquare)) * ( myVoteAmount / totalVoteAmount ) * curatorDailyReward;

  reward  = Math.floor(reward * 100000) / 100000;
  return reward;
}