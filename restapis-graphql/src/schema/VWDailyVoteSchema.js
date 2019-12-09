const { schemaComposer } = require('graphql-compose');
const {VWDailyVote, RewardPool} = require('../mongoose/model')
const {utils} = require('decompany-common-utils');
const BSON = require('bson');
const Decimal128 = BSON.Decimal128;
schemaComposer.createObjectTC({
  name: 'DailyVote',
  fields: {
    blockchainTimestamp: 'Float',
    blockchainDate: 'Date',
    documentId: 'String',
    pageview: 'Int',
    totalPageview: 'Int',
    totalPageviewSquare: 'Int',
    reward: 'Float'
  },
});

schemaComposer.Query.addNestedFields({
  "DailyVote.getList": {
    type: '[DailyVote]',
    args: { userId: 'String!', timestamp: 'Float!' },
    resolve: async (_, {userId, timestamp}) => {

      const myVoteList = await VWDailyVote.find({blockchainTimestamp: {$gte: timestamp}, userId: userId}).sort({blockchainTimestamp: -1});
      const myDocList = myVoteList.map((it)=>{
        return it.documentId;
      })

      const totalVoteList = await VWDailyVote.aggregate([{
        $match: {
          blockchainTimestamp: {$gte: timestamp},
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

        totalVote = await getTotalVoteInfo(totalVoteList, myVote.blockchainTimestamp, myVote.documentId);
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
          blockchainDate: date,
          blockchainTimestamp: blockchainTimestamp,
          pageview: myVote.pageview,
          totalPageviewSquare: myVote.totalPageviewSquare,
          reward: reward
        };
      }));

      return resultList
    }
  }
});

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

module.exports = schemaComposer.buildSchema();