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
    statusCode:200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      user: user
    })
  }
  return response;
};
