'use strict';
const { region, warmupConfig } = require('../resources/config.js').APP_PROPERTIES();
const aws = require("aws-sdk");
const lambda = new aws.Lambda({region: region}); 

module.exports.handler = async (event, context, callback) => {

  
  const {prefix, functions} = warmupConfig;

  const payload = JSON.stringify({ source: 'lambda-warmup'});
  
  const result = await Promise.all(functions.map(async (func) => {
    const functionName = prefix?prefix.concat(func.name):func.name;
    const params = {
      ClientContext: Buffer.from(payload).toString('base64'),
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      LogType: "None",
      Qualifier: "$LATEST",
      Payload: payload
    };
    
    const invokeResult = await lambda.invoke(params).promise();
    console.log(`${functionName} concurrency ${isNaN(func.concurrency)?1:func.concurrency} lambda warm up!`);
    console.log("invokeResult", invokeResult);

    return true;
  }));

  return callback(null, "warm up lambda!");
};
