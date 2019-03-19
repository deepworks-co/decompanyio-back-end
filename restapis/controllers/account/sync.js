'use strict';
const jwt = require('jsonwebtoken');
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  const authorizer = event.requestContext.authorizer;
  const parameters = JSON.parse(event.body);
  console.log("authorizer", authorizer);
  console.log("parameters", parameters);
  if(!authorizer || !parameters || !authorizer.principalId){
    return new Error(JSON.stringify({
      success: false,
      message: 'authorizer, principalId or parameters is null'
    }));
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
    provider: provider
  }
  const result = await accountService.syncUserInfo(user);
  
  return JSON.stringify({
    success: true,
    result: result
  });
  
}
