const { schemaComposer } = require('graphql-compose');

schemaComposer.createObjectTC({
    name: 'DocumentV2',
    fields: {
        _id: 'String',
        documentId: 'String',
        accountId: 'String',
        created: 'Date',
        documentName: 'String',
        author: 'UserV2'
    }
});