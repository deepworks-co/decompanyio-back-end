const { schemaComposer } = require('graphql-compose');
const { Document, User } = require('decompany-mongoose').models

schemaComposer.Query.addNestedFields({
  "DocumentV2.GetDocument": {
    type: 'DocumentV2',
    args: { 
      documentId: 'String!'
    },
    resolve: async (_, { documentId }, context, info) => {
      const documents = await Document.aggregate([
        {
          $match: {
            _id: documentId
          }
        }
      ])

      const user = await User.findById({ _id: documents[0].accountId })
      const result = Object.assign(documents[0], {author: user})     
      return result
    }
  }
});