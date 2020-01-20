const { composeWithMongoose } = require('graphql-compose-mongoose');
const { makeExecutableSchema } = require('graphql-tools');
const { schemaComposer } = require('graphql-compose');
const {UserDocumentHistory, Document} = require('decompany-mongoose').models
const console = require('../common/logger');
const utc = composeWithMongoose(UserDocumentHistory, {});



function getResolverField(utc){
  const type = utc.getType();
  const resolvers = utc.getResolvers();
  const query = {}
  const mutation = {}
  
  const iter = resolvers.keys();
  let next = iter.next();
  while(next.done === false){
    //console.log(next);
    const resolverkey = next.value;
    if(resolverkey.startsWith('remove') 
      || resolverkey.startsWith('create') 
      || resolverkey.startsWith('update')){

      if(resolverkey === 'createOne') {
        mutation[`${type}.${resolverkey}WithUserId`] = utc.getResolver(resolverkey).wrapResolve(next=>(rp)=>{
          console.log("rp.args.record", rp.args.record);
          rp.args.record.userId = "what!!?" + Date.now();
          console.log("createOne userId!!!!!")
          return next(rp);
        });
      } else {
        mutation[`${type}.${resolverkey}`] = utc.getResolver(resolverkey);
      }
      //console.log("mutation", `${type}.${resolverkey}`)
    } else {
      query[`${type}.${resolverkey}`] = utc.getResolver(resolverkey);
      //console.log("query", `${type}.${resolverkey}`)
    }
    
    next = iter.next();
  };

  
  return {query, mutation};
}

const fieldsByUtc = getResolverField(utc);
schemaComposer.Query.addNestedFields(fieldsByUtc.query);
//schemaComposer.Mutation.addNestedFields(fieldsByUtc.mutation);
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