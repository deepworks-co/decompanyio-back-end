'use strict';
const {VWDailyPageview, RewardPool} = require('../../mongoose/model')
const {utils} = require('decompany-common-utils');

module.exports = {
  getLast7CreatorReward,
  getTodayEstimatedCreatorReward
}

async function getLast7CreatorReward({userId}){
  const endDate = new Date();
  const startDate = new Date().setDate(endDate.getDate() - 7); 

  const start = utils.getBlockchainTimestamp(startDate);
  const end = utils.getBlockchainTimestamp(endDate);

  const list = await VWDailyPageview.find({blockchainTimestamp: {$gte: start, $lt: end}, userId: userId}).sort({blockchainTimestamp: -1});
  const resultList = await calcRewardList(list);
  return resultList
}

async function getTodayEstimatedCreatorReward({userId}) {
  const t = utils.getBlockchainTimestamp(new Date());
  
  const list = await VWDailyPageview.find({blockchainTimestamp: t, userId: userId});
  const resultList = await calcRewardList(list);

  return resultList?resultList[0]:null;
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
    if(rewardPool){
      it.reward = calcReward({
        pageview: it.pageview,
        totalPageview: it.totalPageview,
        creatorDailyReward: rewardPool.creatorDailyReward
      });
      
    } else {
      it.reward = -1
    }
    it.blockchainDate = new Date(it.blockchainTimestamp);
    return it;
  })
}
function calcReward(args){
  
  const {totalPageview, pageview, creatorDailyReward} = args;
  if(isNaN(totalPageview) || isNaN(pageview) || isNaN(creatorDailyReward)){
    
    return -1;
  }
  let royalty = (pageview / totalPageview)  * creatorDailyReward;
  royalty  = Math.floor(royalty * 100000) / 100000;     

  return royalty;
}
