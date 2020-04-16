const { schemaComposer } = require('graphql-compose');

const getLast6CreatorReward = require("../resolver/creator/GetLast6CreatorRewardResolver");
const getTodayEstimatedCreatorReward = require("../resolver/creator/GetTodayEstimatedCreatorRewardResolver");

const getLast6CuratorReward = require("../resolver/curator/GetLast6CuratorRewardResolver");
const getTodayEstimatedCuratorReward = require("../resolver/curator/GetTodayEstimatedCuratorRewardResolver");

schemaComposer.createObjectTC({
  name: 'DailyCuratorReward',
  fields: {
    voteDate: 'Date',
    documentId: 'String',
    reward: 'Float'
  },
});


schemaComposer.Query.addNestedFields({
  "ProfileSummary.getLast6CreatorReward": {
    type: '[CreatorRoyalty]',
    args: { userId: 'String!'},
    resolve: async (_, args) => getLast6CreatorReward(args)
  },
  "ProfileSummary.getTodayEstimatedCreatorReward": {
    type: '[CreatorRoyalty]',
    args: { userId: 'String!', timestamp: 'Float' },
    resolve: async (_, args) => getTodayEstimatedCreatorReward(args)
  },
  "ProfileSummary.getLast6CuratorReward": {
    type: '[DailyCuratorReward]',
    args: { userId: 'String!'},
    resolve: async (_, args) => getLast6CuratorReward(args)
  },
  "ProfileSummary.getTodayEstimatedCuratorReward": {
    type: '[DailyCuratorReward]',
    args: { userId: 'String!'},
    resolve: async (_, args) => getTodayEstimatedCuratorReward(args)
  }
});


module.exports = {}