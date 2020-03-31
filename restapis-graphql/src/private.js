'use strict';
const { ApolloServer, gql, AuthenticationError } = require('apollo-server-lambda');
const {mongodb} = require('decompany-app-properties')//require('./mongoose');
const {connectToDB,  mongoDBStatus} = require('decompany-mongoose')//require('./mongoose');

const {schema} = require('./schema/privateSchema');

const conn = connectToDB(mongodb.endpoint);

const isDebugging = process.env.stage === "local" || process.env.stage === "localdev"?true:false
const isLocal = process.env.stage === "local" || process.env.stage === "localdev"?true:false
const server = new ApolloServer({
  schema,
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // the `playground` and `introspection` options must be set explicitly to `true`.
  playground: isLocal,
  introspection: isLocal,
  debug: isDebugging,
  formatError: (err)=>{
    if(isDebugging) console.error("Graphql Error", JSON.stringify(err));
    else return new Error(err.toString());
    return err;
  },
  formatResponse: (response)=>{
    return response;
  },
  engine: {
    rewriteError(err) {
      console.log("Engine Error", err);
      return err;
    }
  },
  context: async ({event} )=>{
    //console.log("isLocal", JSON.stringify(event))
    if(isLocal && !event.isOffline){
      //console.log("isLocal", JSON.stringify(event))
      return { principalId: event.requestContext.authorizer.principalId, conn }
    }
    
    let {principalId} = event.requestContext && event.requestContext.authorizer?event.requestContext.authorizer:{};

    if(!principalId) {
      throw new Error('[401] Unauthorized: graphql')
    }
    
    return {headers: event.headers, principalId, conn}
  }
});

module.exports.handler = async (event, context, callback) => {

  const status = mongoDBStatus();
  if(!status || status.readyState === 0 || status === 3){
    console.log("mongoDBStatus", status);
    db = connectToDB(mongodb.endpoint);
  }

  const handler = server.createHandler({cors: {
    origin: '*',
    credentials: true
  }});
  
  const response = await runApolloHandler(event, context, handler);
  return response;
}

function runApolloHandler(event, context, handler) {
  return new Promise((resolve, reject) => {
		const callback = (error, body) => {
      if(error){
        console.log("runApolloHandler Error", error);
        reject(error)
      } else {
        resolve(body);
      }
    }

		handler(event, context, callback);
	});
}
