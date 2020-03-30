const { schemaComposer } = require('graphql-compose');

const determineCreatorRoyalty = require("../resolver/creator/DetermineCreatorRoyalty");
const getClaimableRoyalty = require("../resolver/creator/GetClaimableRoyaltyResolver");


schemaComposer.createObjectTC({
  name: 'DetermineCreatorRoyalty',
  fields: {
    activeDate: 'Date',
    documentId: 'String',
    userId: 'String',
    pageview: 'Int',
    totalPageview: 'Int',
    royalty: 'Float'
  },
});

schemaComposer.createObjectTC({
  name: 'GetClaimableRoyalty',
  fields: {
    activeDate: 'Date',
    documentId: 'String',
    userId: 'String',
    pageview: 'Int',
    totalPageview: 'Int',
    royalty: 'Float'
  },
});



schemaComposer.Query.addNestedFields({
  "Creator.determineCreatorRoyalty": {
    type: '[DetermineCreatorRoyalty]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => determineCreatorRoyalty(args)
  }
});

schemaComposer.Query.addNestedFields({
  "Creator.getClaimableRoyalty": {
    type: '[GetClaimableRoyalty]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => getClaimableRoyalty(args)
  }
});


module.exports = schemaComposer.buildSchema();