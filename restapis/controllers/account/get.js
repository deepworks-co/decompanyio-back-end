'use strict';

module.exports.handler = async (event, context, callback) => {
  const data = JSON.parse(event.body);

  if(!data){
    return {
      success: false,
      message: "parameter is null"
    }
  }

  const accountService = new AccountService();
  let user = null
  if(data.id){
    user = await accountService.getUserInfo({
      id: data.id
    });
  } else if(data.email){
    user = await accountService.getUserInfo({
      email: data.email
    });
  } else {
    throw new Error("Not enough query parameters");
  }


  const response = {
    success: true,
    user: user
  };

  return response;

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
