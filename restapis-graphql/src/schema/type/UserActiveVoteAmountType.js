const { schemaComposer } = require('graphql-compose');

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
 