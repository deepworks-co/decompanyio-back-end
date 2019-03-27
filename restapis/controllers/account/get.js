'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const {principalId, body} = event;
  const {query} = event;

  const accountService = new AccountService();
  let user = null;

  user = await accountService.getUserInfo({
    id: principalId
  });

  if(!user){
    throw new Error("user is not exists... " + JSON.stringify(query));
  }
  
  return JSON.stringify({
    success: user?true:false,
    user: user
  });
};
