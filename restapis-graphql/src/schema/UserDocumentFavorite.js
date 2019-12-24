const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const {UserDocumentFavorite} = require('../mongoose/model')

const utc = composeWithMongoose(UserDocumentFavorite, {});

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
        mutation[`${type}.${resolverkey}WithUserId`] = utc.getResolver(resolverkey).wrapResolve(next=>(rp, context)=>{
          console.log("rp.args.record", rp, context);
          rp.args.record.userId = "what!!?" + Date.now();
          console.log("createOne userId!!!!!")
          return next(rp);
        });
      } else {
        mutation[`${type}.${resolverkey}`] = utc.getResolver(resolverkey);
      }

    } else if(resolverkey.startsWith('find') 
      || resolverkey.startsWith('count') 
      || resolverkey.startsWith('pagination')
      || resolverkey.startsWith('connection')  ){

      query[`${type}.${resolverkey}`] = utc.getResolver(resolverkey);
    }
    
    next = iter.next();
  };

  
  return {query, mutation};
}
const fieldsByUtc = getResolverField(utc);
schemaComposer.Query.addNestedFields(fieldsByUtc.query);
//schemaComposer.Mutation.addNestedFields(fieldsByUtc.mutation);

/*
schemaComposer.addTypeDefs(`
  type Mutation {
    addFavorite(documentId: String!): ${utc.getType()}
  }
`);
schemaComposer.addResolveMethods({
  Mutation: {
    addFavorite: async (root,args, context, info) => {
      return await UserDocumentFavorite.create({userId: "test_" + Date.now(), documentId: args.documentId});
    }
  }
});
*/
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
      return true;
    },
  },
});


module.exports = schemaComposer.buildSchema();