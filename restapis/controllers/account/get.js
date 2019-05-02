'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  console.log(JSON.stringify(event));
  const {principalId, query} = event;

  const accountService = new AccountService();
  let user = null;

  user = await accountService.getUserInfo({
    id: principalId
  });

  if(!user){
    throw new Error("user does not exist... " + JSON.stringify(query));
  }
  
  return JSON.stringify({
    success: user?true:false,
    user: user
  });
};
