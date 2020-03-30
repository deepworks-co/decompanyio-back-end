const { schemaComposer } = require('graphql-compose');

const {getLast6CreatorReward, getTodayEstimatedCreatorReward} = require("../resolver/royalty/CreatorRewardResolver");

const getLast6CuratorReward = require("../resolver/reward/GetLast6CuratorRewardResolver");
const getTodayEstimatedCuratorReward = require("../resolver/reward/GetTodayEstimatedCuratorRewardResolver");

schemaComposer.createObjectTC({
  name: 'DailyCreatorReward',
  fields: {
    activeDate: 'Date',
    documentId: 'String',
    pageview: 'Int',
    totalPageview: 'Int',
    reward: 'Float'
  },
});

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
    type: '[DailyCreatorReward]',
    args: { userId: 'String!'},
    resolve: async (_, args) => getLast6CreatorReward(args)
  },
  "ProfileSummary.getTodayEstimatedCreatorReward": {
    type: '[DailyCreatorReward]',
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


module.exports = schemaComposer.buildSchema();