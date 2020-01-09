'use strict';
const console = require('./common/logger');
const { ApolloServer, gql, AuthenticationError } = require('apollo-server-lambda');
const {connectToDB, connectToMongoDB, mongoDBStatus, models} = require('./mongoose');
const {schema} = require('./schema');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY;
connectToDB();

const isDebugging = process.env.stage === "local"?true:false
const server = new ApolloServer({
  schema,
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // the `playground` and `introspection` options must be set explicitly to `true`.
  playground: process.env.stage==='dev' || process.env.stage==='local'?true:false,
  introspection: process.env.stage==='dev' || process.env.stage==='local'?true:false,
  debug: isDebugging,
  formatError: (err)=>{
    if(isDebugging) console.error("Graphql Error", JSON.stringify(err));
    else return new Error(err.toString());
    return err;
  },
  formatResponse: (response)=>{
    //console.log("formatResponse", response);
    return response;
  },
  engine: {
    rewriteError(err) {
      console.log("Engine Error", err);
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
      //console.log("authorized principalId", principalId);
    }

    return {headers: event.headers, principalId}
  }
});

module.exports.handler = async (event, context, callback) => {
  
  const status = mongoDBStatus();
  if(!status || status.readyState === 0 || status === 3){
    console.log("mongoDBStatus", status);
    db = connectToDB();
  }
  //console.log("db.readyState", dbState[db.readyState]);
  //console.log("stage", process.env.stage)
  
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