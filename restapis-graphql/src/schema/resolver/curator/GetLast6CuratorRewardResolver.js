'use strict';
const {VWDailyVote, VWDailyPageview, RewardPool} = require('decompany-mongoose').models
const {utils} = require('decompany-common-utils');
const {applicationConfig} = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;
const Web3Utils = require('web3-utils');
const BigNumber = require('bignumber.js');

module.exports = getLast6CuratorReward;

async function getLast6CuratorReward({userId}) {

  const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
  const before6Days = utils.getDate(nowDate, -1 * (ACTIVE_VOTE_DAYS - 1));
  const startDate = utils.getDate(before6Days, -1 * ACTIVE_VOTE_DAYS);

  const start = utils.getBlockchainTimestamp(startDate);
  const end = utils.getBlockchainTimestamp(nowDate);

  const myVoteList = await VWDailyVote.find({blockchainTimestamp: {$gte: start, $lt: end}, userId: userId}).sort({blockchainTimestamp: 1});

  const myVoteMatrix = await getDailyMyVoteMatrix({myVoteList, baseDate: before6Days, end});
  //console.log("myVoteMatrix", JSON.stringify(myVoteMatrix));

  const totalVoteMap = await getDailyTotalVoteMap({start, end, myVoteList});

  const rewardPoolList = await RewardPool.find({});
  
  const resultList = await calcRewardMatrix({myVoteMatrix, totalVoteMap, rewardPoolList})

  //console.log("result", JSON.stringify(resultList));

  return resultList.map((list)=>{
    const item = list[0];
    
    return {
      userId: item.userId,
      documentId: item.documentId,
      voteDate: item.voteDate,
      pageview: item.pageview,
      totalPageviewSquare: item.totalPageviewSquare,
      reward: list.map((it)=>{return it.reward}).reduce((sum, cur)=>{
        return Number(sum) + Number(cur);
      })
    }
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

  const myVoteMatrix = totalVoteList.map((totalVote)=>{
    //console.log("myVote", JSON.stringify(myVote));
    const {blockchainTimestamp, documentId} = totalVote._id;
    const voteDate = new Date(blockchainTimestamp);
    const {totalVoteAmount} = totalVote;

    return Array(ACTIVE_VOTE_DAYS).fill(0).map((it, index)=>{
      const activeDate = utils.getDate(voteDate, index);
      return {
        documentId,
        activeTimestamp: utils.getBlockchainTimestamp(activeDate),
        activeDate,
        totalVoteAmount
      }
    })
    
  })
  //console.log("myVoteMatrix", JSON.stringify(myVoteMatrix))
  
  let mergedList = [].concat.apply([], myVoteMatrix);
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
async function getDailyMyVoteMatrix({myVoteList, baseDate, end}){
    
  const myVoteMatrix = myVoteList.map((myVote)=>{
    //console.log("myVote", JSON.stringify(myVote));
    const {blockchainTimestamp} = myVote._id;
    const voteDate = new Date(blockchainTimestamp);

    return Array(ACTIVE_VOTE_DAYS).fill(0).map((it, index)=>{
      const activeDate = utils.getDate(voteDate, index);
      if(activeDate.getTime() >= baseDate.getTime() && activeDate.getTime() < new Date(end).getTime()){
        const {userId, documentId, totalDeposit} = myVote;
        
        return {
          userId,
          documentId,
          voteDate,
          activeTimestamp: utils.getBlockchainTimestamp(activeDate),
          activeDate,
          totalDeposit
        }
      } else {
        return null;
      }
    }).filter((it)=>{
      return it?true:false
    })
    
  }).filter((it)=>{
    return it.length>0?true:false
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
      blockchainDate: new Date(activeTimestamp),
      blockchainTimestamp: activeTimestamp,
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