const { schemaComposer } = require('graphql-compose');

const determineCreatorRoyalty = require("../resolver/creator/DetermineCreatorRoyaltyResolver");
const getClaimableRoyalty = require("../resolver/creator/GetClaimableRoyaltyResolver");
const getNDaysRoyalty = require("../resolver/creator/GetNDaysRoyaltyResolver");



schemaComposer.Query.addNestedFields({
  "Creator.determineCreatorRoyalty": {
    type: '[CreatorRoyalty]',
    args: { documentId: 'String!'},
    resolve: (_, args) => determineCreatorRoyalty(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Creator.getClaimableRoyalty": {
    type: '[CreatorRoyalty]',
    args: { documentId: 'String!'},
    resolve: (_, args) => getClaimableRoyalty(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Creator.getNDaysRoyalty": {
    type: '[CreatorRoyalty]',
    args: { days: 'Int!', documentId: 'String!'},
    resolve: (_, args) => getNDaysRoyalty(args)
  }
});

module.exports = schemaComposer.buildSchema();