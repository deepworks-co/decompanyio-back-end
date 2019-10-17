'use strict';

const wallet = require("decompany-wallet");

module.exports.handler = async (event, context, callback) => {

  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }

  const {principalId} = event;
  try{
    const account = await wallet.newAccount({principalId});

    const response = JSON.stringify({
      success: true, 
      account: account
    })
    
    return response;
  } catch(err){
    console.error(err);
    return callback(new Error(`[500] ${err.toString()}`));
  }
  
};
