const { schemaComposer } = require('graphql-compose');

const determineCreatorRoyalty = require("./resolver/creator/DetermineCreatorRoyalty");


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



schemaComposer.Query.addNestedFields({
  "Creator.determineCreatorRoyalty": {
    type: '[DetermineCreatorRoyalty]',
    args: { userId: 'String!', documentId: 'String!'},
    resolve: (_, args) => determineCreatorRoyalty(args)
  }
});


module.exports = schemaComposer.buildSchema();