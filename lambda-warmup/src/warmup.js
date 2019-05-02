'use strict';
const { region, warmupConfig } = require('../resources/config.js').APP_PROPERTIES();
const aws = require("aws-sdk");
const lambda = new aws.Lambda({region: region}); 

module.exports.handler = async (event, context, callback) => {

  console.log("Warm Up Start");

  const {prefix, functions} = warmupConfig;

  const payload = JSON.stringify({ source: 'lambda-warmup'});
  
  const invokes = await Promise.all(functions.map(async (func) => {
    const functionName = prefix?prefix.concat(func.name):func.name;
    const params = {
      ClientContext: Buffer.from(payload).toString('base64'),
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      LogType: "None",
      Qualifier: "$LATEST",
      Payload: payload
    };

    try {
      await Promise.all(Array(func.concurrency).fill(0)
        .map(async _ => await lambda.invoke(params).promise()));

      console.log(`${functionName} concurrency ${isNaN(func.concurrency)?1:func.concurrency} lambda warm up!`);
      return true;
    } catch (e) {
      console.log(`Warm Up Invoke Error: ${func.name}`, e);
      return false;
    }
   
  }));
  
  console.log(`Warm Up Finished with ${invokes.filter(r => !r).length} invoke errors`);

  return callback(null, "warm up lambda!");
};
