'use strict';
const console = require('../common/logger');
const { ApolloServer, gql } = require('apollo-server-lambda');
const {connectToMongoDB, models} = require('../mongoose');
const {schema} = require('../schema');
const jwt = require('jsonwebtoken');
// Set in `environment` of serverless.yml
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY;
let db;
const server = new ApolloServer({
  schema,
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // the `playground` and `introspection` options must be set explicitly to `true`.
  playground: true,
  introspection: true,
  context: async ({event} )=>{
    console.log("event.authorizationToken", event.headers);
    const {Authorization} = event.headers;
    let principalId;
    if(Authorization){
      principalId = await authorize(Authorization)
      console.log("principalId", principalId);
    }
    
    return {principalId}
  }
});

module.exports.handler = (event, context, callback) => {

  context.callbackWaitsForEmptyEventLoop = false;
  if(db===undefined){
    console.log("db object is undefined");
    db = connectToMongoDB();
  }

  const callbackFilter = function(error, output) {
    if(error) console.error("graphql error!!!", error);
    output.headers['Access-Control-Allow-Origin'] = '*';
    callback(error, output);
  };

  const handler = server.createHandler({cors: {
    origin: '*',
    credentials: true,
  }});

  return handler(event, context, callbackFilter)
}

//module.exports.handler = server.createHandler();

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
          console.log(`Token invalid. ${verifyError}`);
          return reject(new Error("Unauthorized"));
        }
        // is custom authorizer function
        console.log('valid from customAuthorizer', decoded);
        return resolve(decoded.sub);
      });
    } catch (err) {
      console.error('catch error. Invalid token', err);
      reject(new Error("Unauthorized"));
    }
  })
  
}