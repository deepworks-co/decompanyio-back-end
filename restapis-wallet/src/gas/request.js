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
  context.callbackWaitsForEmptyEventLoop = false;
  const {principalId} = event;
  try{
    const result = await wallet.requestGas({principalId});

    const response = JSON.stringify({
      success: true,
      result: result
    })
    
    return response;
  } catch(err){
    throw new Error(`[500] ${err}`);
  }
  
};
