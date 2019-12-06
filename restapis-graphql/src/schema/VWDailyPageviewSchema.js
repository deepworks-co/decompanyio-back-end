const { schemaComposer } = require('graphql-compose');
const {VWDailyPageview, RewardPool} = require('../mongoose/model')

schemaComposer.createObjectTC({
  name: 'DailyPageviewId',
  fields: {
    year: 'Int',
    month: 'Int',
    dayOfMonth: 'Int',
    id: 'String'
  },
});

schemaComposer.createObjectTC({
  name: 'DailyPageview',
  fields: {
    _id: 'DailyPageviewId',
    blockchainTimestamp: 'Float',
    documentId: 'String',
    pageview: 'Int',
    totalPageview: 'Int',
    totalPageviewSquare: 'Int',
    reward: 'Float'
  },
});

schemaComposer.Query.addNestedFields({
  "DailyPageview.getList": {
    type: '[DailyPageview]',
    args: { userId: 'String!', timestamp: 'Int!' },
    resolve: async (_, {userId, timestamp}) => {
      const rewardPoolList = await RewardPool.find({});
      const list = await VWDailyPageview.find({blockchainTimestamp: {$gte: timestamp}, userId: userId}).sort({blockchainTimestamp: -1}).limit(2);
      const resultList = await calcRewardList(list, rewardPoolList);
      return resultList
    }
  }
});



function getRewardPool(rewardPoolList, curDate){
  
  const r = rewardPoolList.filter((it)=>{
    const {start, end} = it._id;
    if(start <= curDate && end>curDate){
      return true;
    } else {
      return false;
    }
   
  })
  return r[0];
}


async function calcRewardList(list, rewardPoolList) {
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
    
    return it;
  })
}
function calcReward(args){
  
  const {totalPageview, pageview, creatorDailyReward} = args;
  if(!totalPageview || !pageview || !creatorDailyReward){
    
    return -1;
  }
  let royalty = (pageview / totalPageview)  * creatorDailyReward;
  royalty  = Math.floor(royalty * 100000) / 100000;     

  return royalty;
}

module.exports = schemaComposer.buildSchema();