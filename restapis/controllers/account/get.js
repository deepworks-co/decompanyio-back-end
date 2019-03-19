'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  console.log("event", event.query);
  let data = event.query;
  if(typeof(data.query)==='string'){
    data = JSON.parse(event.query);
  }

  if(!data.id){
    throw new Error("parameters are invalid!");
  }
  const accountService = new AccountService();
  let user = null;
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

  if(!user){
    console.error("user is not exists... ", data);
    throw new Error("user is not exists... " + JSON.stringify(data));
  }

  const response = JSON.stringify({
    success: user?true:false,
    user: user
  });
  
  return response;
};
