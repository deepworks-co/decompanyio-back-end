'use strict';
const { region, warmupConfig } = require('../resources/config.js').APP_PROPERTIES();
const aws = require("aws-sdk");
const lambda = new aws.Lambda({region: region}); 

module.exports.handler = async (event, context, callback) => {
  
  const prefix = warmupConfig.prefix;
  const functions = warmupConfig.functions;
  const payload = JSON.stringify({ source: 'lambda-warmup'});
  
  const result = await Promise.all(functions.map(async (func) => {

    const params = {
      ClientContext: Buffer.from(payload).toString('base64'),
      FunctionName: func.functionName,
      InvocationType: "RequestResponse",
      LogType: "None",
      Qualifier: "$LATEST",
      Payload: payload
    };
    await lambda.invoke(params).promise();
    console.log(`{func} lambda warm up!`);

    return true;
  }));

  return callback(null, "warm up lambda!");
};
