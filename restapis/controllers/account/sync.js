'use strict';
const jwt = require('jsonwebtoken');
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  console.log(event);
  const {principalId, body} = event;
  console.log("principalId", principalId);
  console.log("parameters", body);
  if(!principalId || !body ){
    return new Error(JSON.stringify({
      success: false,
      message: 'principalId or parameters is invalid!'
    }));
  }

  const claims = body;
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
