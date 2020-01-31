const { schemaComposer } = require('graphql-compose');

const getTodayUserActiveVoteAmount = require("./resolver/curator/GetTodayUserActiveVoteAmount");
const getTodayActiveVoteAmount = require("./resolver/curator/GetTodayActiveVoteAmount");
const determineCuratorReward = require("./resolver/curator/DetermineCuratorReward");
const getClaimableReward = require("./resolver/curator/GetClaimableRewardResolver");


schemaComposer.createObjectTC({
  name: 'UserActiveVoteAmount',
  fields: {
    activeDate: 'Date',
    voteDate: 'Date',
    documentId: 'String',
    userId: 'String',
    voteAmount: 'String'
  },
});

schemaComposer.createObjectTC({
  name: 'DetermineCuratorReward',
  fields: {
    voteDate: 'Date',
    activeDate: 'Date',
    documentId: 'String',
    userId: 'String',
    voteAmount: 'String',
    reward: 'Float'
  },
});

schemaComposer.createObjectTC({
  name: 'GetClaimableReward',
  fields: {
    voteDate: 'Date',
    activeDate: 'Date',
    documentId: 'String',
    userId: 'String',
    voteAmount: 'String',
    reward: 'Float'
  },
});

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
    type: '[DetermineCuratorReward]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => determineCuratorReward(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Curator.getClaimableReward": {
    type: '[GetClaimableReward]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => getClaimableReward(args)
  }
});


module.exports = schemaComposer.buildSchema();