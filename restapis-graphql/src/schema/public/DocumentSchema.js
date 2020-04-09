const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const {Document} = require('decompany-mongoose').models

if(schemaComposer.has(Document.modelName)){
  return;
}

const utc = composeWithMongoose(Document, {});

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
      //mutation[`${type}.${resolverkey}`] = utc.getResolver(resolverkey);
    } else {
      query[`${type}.${resolverkey}`] = utc.getResolver(resolverkey);
    }
    next = iter.next();
  };

  
  return {query, mutation};
}

(()=> {
  const fieldsByUtc = getResolverField(utc);
  schemaComposer.Query.addNestedFields(fieldsByUtc.query);
  //schemaComposer.Mutation.addNestedFields(fieldsByUtc.mutation);  
})();
module.exports = {}