const { schemaComposer } = require('graphql-compose');
const { User } = require('decompany-mongoose').models

schemaComposer.Query.addNestedFields({
  "DocumentV2.GetDocument": {
    type: 'DocumentV2',
    args: { documentId: 'String!'},
    resolve: async (_, { documentId }) => {
      const documents = await Document.aggregate([
        {
          $match: {
            _id: documentId
          }
        }
      ])
      
      return documents[0]
    }
  }
});

schemaComposer.Query.addNestedFields({
  "DocumentV2.GetUser": {
    type: 'UserV2',
    resolve: async (parent) => {
      
      return await User.findById({_id: parent.userId})
    }
  }
});