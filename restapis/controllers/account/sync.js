'use strict';
const jwt = require('jsonwebtoken');
const AccountService = require('./AccountService');

module.exports.handler = (event, context, callback) => {
  console.log("authorizer", event.requestContext.authorizer);
  const authorizer = event.requestContext.authorizer
  if(!authorizer || !authorizer.claims || !authorizer.principalId){
    return callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        message: 'authorizer, principalId or claims is null'
      })
    });
  }
  const claims = authorizer.claims;
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
