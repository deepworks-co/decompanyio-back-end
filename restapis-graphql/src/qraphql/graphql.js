'use strict';
const { ApolloServer, gql } = require('apollo-server-lambda');
const {connectToMongoDB, models} = require('../mongoose');
const {schema} = require('../schema');

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
  context: {
    test: "asdfasf"
  }
});

module.exports.handler = (event, context, callback) => {
  if (event.authorizationToken) {
    console.log("authorized request", event.authorizationToken);
  }

  context.callbackWaitsForEmptyEventLoop = false;
  if(db===undefined){
    console.log("db object is undefined");
    db = connectToMongoDB();
  }

  

  const callbackFilter = function(error, output) {
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