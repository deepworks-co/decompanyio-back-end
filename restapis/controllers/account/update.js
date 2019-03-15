'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {

  const data = JSON.parse(event.body);

  if(!data || !data.id){
    throw new Error("parameter is invalid");
  }

  const accountService = new AccountService();
  const result = await accountService.updateUserInfo({
    id: data.id,
    nickname: data.nickname,
    username: data.username,
    picture: data.picture
  });

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      success: true,
      result: result
    }),
  };

  return callback(null, response);
};
