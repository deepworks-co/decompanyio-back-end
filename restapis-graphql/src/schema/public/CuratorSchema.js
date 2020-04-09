const { schemaComposer } = require('graphql-compose');

const getTodayUserActiveVoteAmount = require("../resolver/curator/GetTodayUserActiveVoteAmount");
const getTodayActiveVoteAmount = require("../resolver/curator/GetTodayActiveVoteAmount");
const determineCuratorReward = require("../resolver/curator/DetermineCuratorReward");
const getClaimableReward = require("../resolver/curator/GetClaimableRewardResolver");



schemaComposer.Query.addNestedFields({
  "Curator.getTodayUserActiveVoteAmount": {
    type: '[UserActiveVoteAmount]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => getTodayUserActiveVoteAmount(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Curator.getTodayActiveVoteAmount": {
    type: '[UserActiveVoteAmount]',
    args: { documentId: 'String!'},
    resolve: (_, args) => getTodayActiveVoteAmount(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Curator.determineCuratorReward": {
    type: '[CuratorReward]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => determineCuratorReward(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Curator.getClaimableReward": {
    type: '[CuratorReward]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => getClaimableReward(args)
  }
});


module.exports = {}