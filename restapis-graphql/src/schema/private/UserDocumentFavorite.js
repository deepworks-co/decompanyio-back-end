const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const { UserDocumentFavorite } = require('decompany-mongoose').models


if(schemaComposer.has(UserDocumentFavorite.modelName)){
  return;
}

const utc = composeWithMongoose(UserDocumentFavorite, {});

schemaComposer.Query.addNestedFields({
  "UserDocumentFavorite.getFavorites": {
    type: 'UserDocumentFavorite',
    resolve: async (_, { }, context, info) => {
      const {principalId} = context;
      if(!principalId){
        throw new Error("[403] Unauthorized");
      }
      return await UserDocumentFavorite.find({userId: principalId});;
    },
  }
})

schemaComposer.Mutation.addNestedFields({
  "UserDocumentFavorite.addFavorite": {
    type: 'UserDocumentFavorite',
    args: {
      documentId: 'String!',
    },
    resolve: async (_, { documentId }, context, info) => {
      const {principalId} = context;
      if(!principalId){
        throw new Error("[403] Unauthorized");
      }
      return await UserDocumentFavorite.create({userId: principalId, documentId: documentId});;
    },
  },
});

schemaComposer.Mutation.addNestedFields({
  "UserDocumentFavorite.removeFavorite": {
    type: 'Boolean',
    args: {
      documentId: 'String!',
    },
    resolve: async (_, { documentId }, context, info) => {
      const {principalId} = context;
      if(!principalId){
        throw new Error("[403] Unauthorized");
      }
      
      const result = await UserDocumentFavorite.deleteOne({userId: principalId, documentId: documentId});
      console.log("removeFavorite", result);
      return Promise.resolve(true);
    },
  },
});

module.exports = {}