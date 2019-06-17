'use strict';
const { region, warmupConfig } = require('decompany-app-properties');
const aws = require("aws-sdk");
const lambda = new aws.Lambda({region: region}); 

module.exports.handler = async (event, context, callback) => {

  console.log("Warm Up Start");

  const {prefix, functions,} = warmupConfig;

  const payload = JSON.stringify({ source: 'lambda-warmup'});
  
  const invokes = await Promise.all(functions.map(async (func) => {
    const functionName = prefix?prefix.concat(func.name):func.name;
    const aliase = func.aliase?func.aliase:"$LATEST";
    const params = {
      ClientContext: Buffer.from(payload).toString('base64'),
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      LogType: "None",
      Qualifier: aliase,
      Payload: payload
    };

    try {
      let concurrentcy = isNaN(func.concurrency)?1:func.concurrency;

      //concurrentcy = concurrentcy -1;
      if(concurrentcy < 0){
        concurrentcy = 0
      }
           
      const results = await Promise.all(Array(concurrentcy).fill(0)
        .map(async _ => await lambda.invoke(params).promise()));

      console.log(`${functionName}:${aliase} concurrency ${results.length} lambda warm up!`);
      return true;
    } catch (e) {
      console.log(`Warm Up Invoke Error: ${func.name}`, e);
      return false;
    }
   
  }));
  
  await Promise.all(invokes);
  console.log(`Warm Up Finished with ${invokes.filter(r => !r).length} invoke errors`);

  return "warm up lambda!";
};
