'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {

  const data = JSON.parse(event.body);

  if(!data){
    return {
      success: false,
      message: "parameter is null"
    }
  }

  const accountService = new AccountService();
  const result = accountService.updateUserInfo({
    id: data.id,
    nickname: data.nickname,
    username: data.username,
    picture: data.picture
  });

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  return response;

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
