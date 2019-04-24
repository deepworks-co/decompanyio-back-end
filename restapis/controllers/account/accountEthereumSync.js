'use strict';
const AccountService = require('./AccountService');
module.exports.handler = async (event, context, callback) => {
  const {principalId, body} = event;
  const {ethAccount} = body;
  const accountService = new AccountService();
  const user = await accountService.getUserInfo({id: principalId});
  
  if(!ethAccount){
    throw new Error("parameter is invalid!");
  }

  if(!user){
    throw new Error(`user is not exists`);
  }

  if(user.ethAccount){
    throw new Error(`The ethereum account has already been registered. ${user.ethAccount}`);
  } 
  
  const result = await accountService.updateUserEthAccount(accountId, ethAccount);

  
  const response = JSON.stringify({
    success: true,
    ethAccount: user.ethAccount
  })

  return callback(null, response);

};
