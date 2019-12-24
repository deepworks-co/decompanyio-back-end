'use strict';
const {VWDailyPageview, VWDailyVote, RewardPool, ClaimRoyalty} = require('../mongoose/model')
const {utils} = require('decompany-common-utils');
const { schemaComposer } = require('graphql-compose');

schemaComposer.createObjectTC({
  name: 'CreatorReward',
  fields: {
    documentId: 'String',
    title: 'String',
    blockchainTimestamp: 'Float',
    blockchainDate: 'Date',
    seoTitle: 'String',
    reward: 'Float'
  },
});

schemaComposer.createObjectTC({
  name: 'CuratorReward',
  fields: {
    documentId: 'String',
    title: 'String',
    seoTitle: 'String',
    reward: 'Float'
  },
});

schemaComposer.Query.addNestedFields({
  "Reward.getCreatorRewards": {
    type: "[CreatorReward]",
    args: { documentId: 'String!'},
    resolve: async (_, args) => {
      const {documentId} = args;

      const lastClaim = await ClaimRoyalty.find({
        documentId: documentId
      }).sort({_id: -1}).limit(1);

      const lastClaimTimestamp = lastClaim[0]?lastClaim[0].blockchainTimestamp:0;

      const resultList = await VWDailyPageview.aggregate([
        { 
          $match: {
            documentId: documentId, 
            blockchainTimestamp: {$gt: lastClaimTimestamp}
          }
        },
        {
          $lookup: {
            from: "REWARD-POOL-DAILY",
            localField: "blockchainTimestamp",
            foreignField: "_id",
            as: "rewardInfo"
          }
        }, 
        {
          $unwind: {
            path: "$rewardInfo"
          }
        }
      ]);
      return resultList.map((it)=>{
        console.log(it);
        return {
          documentId: it.documentId,
          blockchainTimestamp: it.blockchainTimestamp,
          blockchainDate: new Date(it.blockchainTimestamp),
          reward: utils.calcRoyalty({
            totalPageview: it.totalPageview, pageview: it.pageview, creatorDailyReward: it.rewardInfo.creatorDailyReward
          })
        }
      })
    }
  }
});


module.exports = schemaComposer.buildSchema();