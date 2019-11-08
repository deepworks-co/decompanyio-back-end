'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {principalId, body} = event;
  
  if(!body){
    throw new Error("parameter is invalid");
  }

  if(body.username){
    //body.username = body.username.replace(/</g,"&lt;");
    //body.username = body.username.replace(/>/g,"&gt;");
    body.username = body.username.replace(/[^a-z0-9 _-]/gi, '-').toLowerCase();
  }

  

  const accountService = new AccountService();
  const result = await accountService.updateUserInfo({
    id: principalId,
    nickname: body.nickname,
    username: body.username,
    picture: body.picture,
    croppedArea: body.croppedArea
  });

  const response = JSON.stringify({
    success: true,
    result: result
  });

  return callback(null, response);
};
