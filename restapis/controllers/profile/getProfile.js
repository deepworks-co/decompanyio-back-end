'use strict';
const AccountService = require('../account/AccountService');

module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const {query} = event;

  if(!query || !query.email){
    throw new Error("parameter is invalid!!");
  }

  const accountService = new AccountService();

  const user = await accountService.getUserInfo({
    email: query.email
  }, {email: 1, name: 1, username:1, picture: 1, nickname: 1, family_name:1 });
  
  if(!user){
    throw new Error("user is not exists... " + JSON.stringify(query));
  }
  
  return JSON.stringify({
    success: user?true:false,
    user: user
  });
};
