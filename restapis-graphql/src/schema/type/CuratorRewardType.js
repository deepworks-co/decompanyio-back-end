const { schemaComposer } = require('graphql-compose');

  
schemaComposer.createObjectTC({
    name: 'CuratorReward',
    fields: {
        voteDate: 'Date',
        activeDate: 'Date',
        documentId: 'String',
        userId: 'String',
        voteAmount: 'String',
        reward: 'Float'
    }
});
  