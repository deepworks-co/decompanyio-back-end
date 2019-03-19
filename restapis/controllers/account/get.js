'use strict';
const AccountService = require('./AccountService');

module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  
  const {query} = event;

  const {id, email} = query;

  if(!id || !email){
    throw new Error("user id or email is invalid!");
  }
  const accountService = new AccountService();
  let user = null;
  if(data.id){
    user = await accountService.getUserInfo({
      id: id
    });

  } else if(data.email){
    user = await accountService.getUserInfo({
      email: data.email
    });
  } else {
    throw new Error("Not enough query parameters");
  }

  if(!user){
    throw new Error("user is not exists... " + JSON.stringify(query));
  }
  
  return JSON.stringify({
    success: user?true:false,
    user: user
  });
};
