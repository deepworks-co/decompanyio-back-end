'use strict';
const AccountService = require('../account/AccountService');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  console.log(JSON.stringify(event));
  const {query} = event;
  const {username, email} = query;

  const accountService = new AccountService();

  const params = {}
  if(email){
    params.email = email;
  } else if(username) {
    params.username = decodeURI(username);
  } else {
    throw new Error("parameter is invalid!!")
  }

  const user = await accountService.getUserInfo(params, {email: 1, name: 1, username:1, picture: 1, nickname: 1, family_name:1, ethAccount: 1 });
  
  if(!user){
    return JSON.stringify({
      success: true,
      message: "user does not exist... " + JSON.stringify(query)
    });
  }
  
  return JSON.stringify({
    success: user?true:false,
    user: user
  });
};
