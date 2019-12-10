'use strict';
const AccountService = require('./AccountService');
module.exports.handler = async (event, context, callback) => {
   /** Immediate response for WarmUp plugin */
   if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {principalId, body} = event;
  const {ethAccount} = body;
  const accountService = new AccountService();
  let user = await accountService.getUserInfo({id: principalId});
  
  if(!ethAccount){
    throw new Error("parameter is invalid!");
  }

  if(!user){
    throw new Error(`user does not exist`);
  }

  if(user.ethAccount){
    console.log(`The ethereum account has already been registered. ${user.ethAccount}`);
    //throw new Error(`The ethereum account has already been registered. ${user.ethAccount}`);
    return JSON.stringify({
      success: true,
      user: user
    })
  } 
  
  const result = await accountService.updateUserEthAccount(principalId, ethAccount);

  user = await accountService.getUserInfo({id: principalId});

  
  const response = JSON.stringify({
    success: true,
    user: user
  })

  return response;

};
