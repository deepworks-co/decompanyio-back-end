const { schemaComposer } = require('graphql-compose');

const {getLast7CreatorReward, getTodayEstimatedCreatorReward} = require("./resolver/CreatorRewardResolver");
const {getLast7CuratorReward, getTodayEstimatedCuratorReward} = require("./resolver/CuratorRewardResolver");

schemaComposer.createObjectTC({
  name: 'DailyCreatorReward',
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

schemaComposer.createObjectTC({
  name: 'DailyVoteReward',
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
  "ProfileSummary.getLast7CreatorReward": {
    type: '[DailyCreatorReward]',
    args: { userId: 'String!'},
    resolve: async (_, args) => getLast7CreatorReward(args)
  },
  "ProfileSummary.getTodayEstimatedCreatorReward": {
    type: 'DailyCreatorReward',
    args: { userId: 'String!', timestamp: 'Float' },
    resolve: async (_, args) => getTodayEstimatedCreatorReward(args)
  },
  "ProfileSummary.getLast7CuratorReward": {
    type: '[DailyVoteReward]',
    args: { userId: 'String!'},
    resolve: async (_, args) => getLast7CuratorReward(args)
  },
  "ProfileSummary.getTodayEstimatedCuratorReward": {
    type: 'DailyVoteReward',
    args: { userId: 'String!'},
    resolve: async (_, args) => getTodayEstimatedCuratorReward(args)
  }
});


module.exports = schemaComposer.buildSchema();