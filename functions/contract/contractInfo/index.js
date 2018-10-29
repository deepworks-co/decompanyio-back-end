'use strict';


const contractUtil = require('../../commons/contract/contractWapper.js');

/*
* function name : contractInfo
*/
module.exports.handler = (event, context, callback) => {

  contractUtil.printContractInfo();

  return callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: "done",
      request: context.requestId
    })
  });

};
