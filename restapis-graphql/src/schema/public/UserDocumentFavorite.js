const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const {UserDocumentFavorite} = require('decompany-mongoose').models
if(schemaComposer.has(UserDocumentFavorite.modelName)){
  return;
}

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




module.exports = schemaComposer.buildSchema();