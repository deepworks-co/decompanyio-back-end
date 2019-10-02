'use strict';
const console = require('../common/logger');
const { ApolloServer, gql, AuthenticationError } = require('apollo-server-lambda');
const {connectToMongoDB, mongoDBStatus, models} = require('../mongoose');
const {schema} = require('../schema');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY;
let db;
const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
const server = new ApolloServer({
  schema,
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // the `playground` and `introspection` options must be set explicitly to `true`.
  playground: true,
  introspection: true,
  debug: true,
  formatError: (err, data)=>{
    if(err) console.error(err);
  },
  formatResponse: (response, request)=>{
    //console.log("formatResponse", response);

    //console.log("formatResponse", data);
  },
  engine: {
    rewriteError(err) {
      console.log("engine error", err);
      return err;
    }
  },
  context: async ({event} )=>{
    
    const {Authorization} = event.headers;
    let principalId;
    if(Authorization){
      //console.log("event.authorizationToken", event.headers);
      principalId = await authorize(Authorization)
      //principalId = "google-oauth2|101778494068951192848"
      console.log("authorized principalId", principalId);
    }

    return {headers: event.headers, principalId}
  }
});

module.exports.handler = async (event, context, callback) => {

  context.callbackWaitsForEmptyEventLoop = false;
  if(db===undefined || db.readyState !== 1){
    console.log("db connecting!!");
    db = await connectToMongoDB();
  } 
  console.log("db.readyState", dbState[db.readyState]);
  console.log("stage", process.env.stage)
  
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