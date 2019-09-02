const { composeWithMongoose } = require('graphql-compose-mongoose');
const { makeExecutableSchema } = require('graphql-tools');
const { schemaComposer } = require('graphql-compose');
const {UserDocumentHistory} = require('../mongoose/model')

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
schemaComposer.Mutation.addNestedFields(fieldsByUtc.mutation);


module.exports = schemaComposer.buildSchema();