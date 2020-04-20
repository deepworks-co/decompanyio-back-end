const { schemaComposer } = require('graphql-compose');
const TYPE_NAME = 'CreatorRoyalty'
schemaComposer.createObjectTC({
    name: TYPE_NAME,
    fields: {
        activeDate: 'Date',
        documentId: 'String',
        userId: 'String',
        pageview: 'Int',
        totalPageview: 'Int',
        royalty: 'Float'
    },
});