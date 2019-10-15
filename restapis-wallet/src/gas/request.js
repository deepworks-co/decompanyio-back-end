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
  const result = await wallet.requestGas({principalId});

  const response = JSON.stringify({
    success: true,
    result: result
  })
  
  return response;
};
