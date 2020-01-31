'use strict';
const { ApolloServer, gql, AuthenticationError } = require('apollo-server-lambda');
const {mongodb} = require('decompany-app-properties')//require('./mongoose');
const {connectToDB,  mongoDBStatus} = require('decompany-mongoose')//require('./mongoose');

const {schema} = require('./schema');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY;
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
      return {principalId: event.principalId, conn}
    }
    const {Authorization} = event.headers?event.headers:{};
    let principalId;
    if(Authorization){
      principalId = await authorize(Authorization)
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
  //console.log("db.readyState", dbState[db.readyState]);
  //console.log("stage", process.env.stage)
  //console.log("event", JSON.stringify(event));
  /*
  const callbackFilter = function(error, output) {
    if(error) console.error("graphql error!!!", error);
    output.headers['Access-Control-Allow-Origin'] = '*';
    callback(error, output);
  };
  */
  const handler = server.createHandler({cors: {
    origin: '*',
    credentials: true
  }});
  const response = await runApolloHandler(event, context, handler);
  return response;
  //return handler(event, context, callbackFilter)
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

function authorize(authorizationToken){
  if(!authorizationToken){
    throw new Error("Unauthorized");
  }
  const tokenParts = authorizationToken.split(' ');
  const tokenValue = tokenParts[1];

  const options = {
    audience: AUTH0_CLIENT_ID,
  };

  return new Promise((resolve, reject)=>{
    try {
      jwt.verify(tokenValue, AUTH0_CLIENT_PUBLIC_KEY, options, (verifyError, decoded) => {
        if (verifyError) {
          // 401 Unauthorized
          console.error(`Token invalid. ${verifyError}`);
          return reject(new Error("Unauthorized"));
        }
        // is custom authorizer function
        console.log('valid from customAuthorizer', decoded);
        return resolve(decoded.sub);
      });
    } catch (err) {
      console.error('catch error. Invalid token', err);
      reject(new AuthenticationError("Unauthorized"));
    }
  })
  
}