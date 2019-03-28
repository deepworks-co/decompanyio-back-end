'use strict';
const AccountService = require('./AccountService');
module.exports.handler = (event, context, callback) => {
  const {principalId, body} = event;
  const  {ethAccount} = body;

  const user = await documentService.getUser(principalId);
  if(!user){
    throw new Error(`user is not exists`);
  }

  if(user.ethAccount){
    throw new Error(`The ethereum account has already been registered. ${user.ethAccount}`);
  } 
  const accountService = new AccountService();
  const result = await accountService.updateUserEthAccount(accountId, ethAccount);

  
  const response = JSON.stringify({
    success: true,
    ethAccount: user.ethAccount
  })

  return callback(null, response);

};
