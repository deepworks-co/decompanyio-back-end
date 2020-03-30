const { composeWithMongoose } = require('graphql-compose-mongoose');
const { makeExecutableSchema } = require('graphql-tools');
const { schemaComposer } = require('graphql-compose');
const {UserDocumentHistory, Document} = require('decompany-mongoose').models
const console = require('../../common/logger');
if(schemaComposer.has(UserDocumentHistory.modelName)){
  return;
}
const utc = composeWithMongoose(UserDocumentHistory, {});

schemaComposer.Mutation.addNestedFields({
  "UserDocumentHistory.addHistory": {
    type: 'UserDocumentHistory',
    args: {
      documentId: 'String!',
    },
    resolve: async (_, { documentId }, context, info) => {

      let {principalId} = context;
      if(!principalId){
        throw new Error("Unauthorized");
      }

      const history = await UserDocumentHistory.findOne({userId: principalId, documentId: documentId});
      console.log("addHistory", JSON.stringify(history));
      const doc = await Document.findOne({_id: documentId});
      if(!doc) {
        throw new Error("Not Found")
      }
      if(history){
        const r =  await UserDocumentHistory.updateOne({_id: history._id}, { updated: Date.now(), $inc: {refs: 1}});
        console.log("addHistory updateOne", r);
      } else {
        const r = await UserDocumentHistory.create({userId: principalId, documentId: documentId});;
        console.log("addHistory createOne", r);
      }

      return {_id: history?history._id:null}
      
    },
  },
});


module.exports = schemaComposer.buildSchema();