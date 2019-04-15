'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  const {principalId, body} = event;
  
  if(!body){
    throw new Error("parameter is invalid");
  }

  const accountService = new AccountService();
  const result = await accountService.updateUserInfo({
    id: principalId,
    nickname: body.nickname,
    username: body.username,
    picture: body.picture
  });

  const response = JSON.stringify({
    success: true,
    result: result
  });

  return callback(null, response);
};
