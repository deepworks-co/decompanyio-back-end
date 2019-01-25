'use strict';
const jwt = require('jsonwebtoken');
const AccountService = require('./AccountService');

module.exports.handler = (event, context, callback) => {
  const authorizer = event.requestContext.authorizer;
  const parameters = JSON.parse(event.body);
  console.log("authorizer", authorizer, parameters);
  if(!authorizer || !parameters || !authorizer.principalId){
    return callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        message: 'authorizer, principalId or parameters is null'
      })
    });
  }
  const claims = parameters;
  const principalId = authorizer.principalId;
  const accountService = new AccountService();
  const provider = claims.sub?claims.sub.split("|")[0]:null;
  const user = {
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
    nickname: claims.nickname,
    family_name: claims.family_name,
    locale: claims.locale,
    sub: claims.sub,
    provider: provider,
    connected: Date.now()
  }
  accountService.syncUserInfo(user).then((result)=>{
    return callback(null, {
      statusCode: 200,
      headers: {
          /* Required for CORS support to work */
        'Access-Control-Allow-Origin': '*',
          /* Required for cookies, authorization headers with HTTPS */
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        result: result
      })
    });
  }).catch((err)=>{
    return callback(null, {
      statusCode: 200,
      headers: {
          /* Required for CORS support to work */
        'Access-Control-Allow-Origin': '*',
          /* Required for cookies, authorization headers with HTTPS */
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        error: err
      })
    });
  });

  
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
}
