const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');

// Load Type Composer
require('../type')

// Load Public Schema
const DocumentSchema = require('./DocumentSchema')
const DocumentFeaturedSchema = require('./DocumentFeaturedSchema')
const DocumentPopularSchema = require('./DocumentPopularSchema')
const UserSchema = require('./UserSchema')
const UserDocumentFavorite = require('./UserDocumentFavorite')
const UserDocumentHistory = require('./UserDocumentHistory')
const ProfileSummarySchema = require('./ProfileSummarySchema')
const CuratorSchema = require('./CuratorSchema')
const CreatorSchema = require('./CreatorSchema')
const DocumentV2 = require('./DocumentV2Schema')


const customizationOptions = {}; // left it empty for simplicity, described below
//schemaComposer.merge(DocumentSchema);
//schemaComposer.merge(UserSchema);
//schemaComposer.merge(TestSchema);
const schema = schemaComposer.buildSchema();
module.exports = {
  schema: schema
}
/*
const {models} = require('../mongoose')
const modelUTCs = Object.keys(models).map((key)=>{
  //console.log(key, typeof(models[key]));
  return composeWithMongoose(models[key], customizationOptions);
});

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

(()=> {
  modelUTCs.forEach((utc)=>{ 
    const fieldsByUtc = getResolverField(utc);
    schemaComposer.Query.addNestedFields(fieldsByUtc.query);
    schemaComposer.Mutation.addNestedFields(fieldsByUtc.mutation);
  })
  
})();
//schemaComposer.merge(DocumentSchema);
const schema = schemaComposer.buildSchema();
module.exports = {
  schema
  //DocumentSchema
}
*/