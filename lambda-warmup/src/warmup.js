'use strict';
const { region, warmupConfig } = require('decompany-app-properties');
const aws = require("aws-sdk");

const WARMUP_PAYLOAD = JSON.stringify({ source: 'lambda-warmup'});
module.exports.handler = async (event, context, callback) => {

  console.log("Warm Up Start");

  const promises = warmupConfig.map((warmup)=>{
    return warmupService(warmup);
  })

  await Promise.all(promises);
  
  

  return "warm up lambda!";
};

async function warmupService(warmup){
  const {enable, prefix, functions} = warmup;

  const lambda = new aws.Lambda({region: warmup.region?warmup.region:region}); 
  if(enable === false){
    console.log(`Warm Up prefix ${prefix} enable ${enable}`);
    return [];
  }

  const payload = WARMUP_PAYLOAD;
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

  console.log(`Warm Up Finished with ${invokes.filter(r => !r).length} invoke errors`);
}