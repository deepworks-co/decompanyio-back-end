'use strict';
const {VWDailyPageview, RewardPool} = require('decompany-mongoose').models
const {utils} = require('decompany-common-utils');
const {applicationConfig} = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;
module.exports = async ({documentId, userId}) => {
  if(!userId || !documentId){
    throw new Error("parameter is not vaild")
  }

  const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
  const startDate = utils.getDate(nowDate, -1 * (ACTIVE_VOTE_DAYS - 1)); 
  const endDate = utils.getDate(nowDate, 1);

  const start = utils.getBlockchainTimestamp(startDate);
  const end = utils.getBlockchainTimestamp(endDate);

  const list = await VWDailyPageview.find({userId: userId, documentId: documentId, blockchainTimestamp: {$gte: start, $lt: end}}).sort({blockchainTimestamp: -1});
  
  const resultList = await calcRewardList(list);
  //console.log("resultList", JSON.stringify(resultList));
  return resultList.map((it)=>{

    return {
      documentId: it.documentId,
      userId: userId,
      activeDate: new Date(it.blockchainTimestamp),
      pageview: it.pageview,
      totalPageview: it.totalPageview,
      royalty: it.reward
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