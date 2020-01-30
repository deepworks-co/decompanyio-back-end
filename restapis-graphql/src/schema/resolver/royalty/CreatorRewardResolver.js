'use strict';
const {VWDailyPageview, RewardPool} = require('decompany-mongoose').models
const {utils} = require('decompany-common-utils');
const {applicationConfig} = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;
module.exports = {
  getLast6CreatorReward,
  getTodayEstimatedCreatorReward
}

async function getLast6CreatorReward({userId}){
  const endDate = new Date();
  const startDate = new Date().setDate(endDate.getDate() - (ACTIVE_VOTE_DAYS - 1)); 

  const start = utils.getBlockchainTimestamp(startDate);
  const end = utils.getBlockchainTimestamp(endDate);

  const list = await VWDailyPageview.find({blockchainTimestamp: {$gte: start, $lt: end}, userId: userId}).sort({blockchainTimestamp: -1});
  
  const resultList = await calcRewardList(list);
  
  return resultList.map((it)=>{

    return {
      documentId: it.documentId,
      activeDate: new Date(it.blockchainTimestamp),
      pageview: it.pageview,
      totalPageview: it.totalPageview,
      royalty: it.reward
    }

  })
}

async function getTodayEstimatedCreatorReward({userId}) {
  const t = utils.getBlockchainTimestamp(new Date());
  
  const list = await VWDailyPageview.find({blockchainTimestamp: t, userId: userId});
  const resultList = await calcRewardList(list);

  return resultList.map((it)=>{

    return {
      documentId: it.documentId,
      activeDate: new Date(it.blockchainTimestamp),
      pageview: it.pageview,
      totalPageview: it.totalPageview,
      reward: it.reward
    }

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


async function calcRewardList(list) {
  const rewardPoolList = await RewardPool.find({});

  return list.map((it)=>{
    const {year, month, dayOfMonth} = it._id;
    const date = new Date(Date.UTC(year, month-1, dayOfMonth));

    const rewardPool = getRewardPool(rewardPoolList, date);
    //console.log("Pageview Item", JSON.stringify(it));
    let reward = -1;
    if(rewardPool){
      reward = utils.calcRoyalty({
        pageview: it.pageview,
        totalPageview: it.totalPageview,
        creatorDailyReward: rewardPool.creatorDailyReward
      });
      
    } 

    return {
      documentId: it.documentId,
      pageview: it.pageview,
      totalPageview: it.totalPageview,
      reward: reward,
      blockchainTimestamp: it.blockchainTimestamp,
      blockchainDate: it.blockchainDate,
      userId: it.userId
    };
  })
}

/*
function calcReward(args){
  
  const {totalPageview, pageview, creatorDailyReward} = args;
  if(isNaN(totalPageview) || isNaN(pageview) || isNaN(creatorDailyReward)){
    
    return -1;
  }
  let royalty = (pageview / totalPageview)  * creatorDailyReward;
  royalty  = Math.floor(royalty * 100000) / 100000;     

  return royalty;
}
*/