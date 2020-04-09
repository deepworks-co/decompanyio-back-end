const { schemaComposer } = require('graphql-compose');

schemaComposer.createObjectTC({
    name: 'UserV2',
    fields: {
        _id: 'String',
        email: 'String',
        name: 'String',
        username: 'String'
    }
});