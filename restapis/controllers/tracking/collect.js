'use strict';
const documentService = require('../documentMongoDB');
const { applicationLogAppender } = require('../../resources/config.js').APP_PROPERTIES();
const {kinesis} = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {

  const headers = event.headers?event.headers:{}
  const body = event.queryStringParameters?event.queryStringParameters:{};

  if(!body.id || !body.cid || !body.sid || !body.t){
    console.log("tracking error", "parameter is invalid")
    return (null, {
      statusCode: 200,
      body: "no collecting"
    })
  }

  if(!body.created){
    body.created = Date.now();
  }

  body.t = Number(body.t)
  body.n = Number(body.n)
  body.referer = headers.Referer;
  body.useragnet = headers["User-Agent"];
  //console.log("tracking body", body);
  if(applicationLogAppender && applicationLogAppender.enable){
    try{
      const partitionKey = "tracking-" + Date.now();
      console.log("put kinesis",applicationLogAppender.region, applicationLogAppender.streamName, partitionKey);
      await kinesis.putRecord(applicationLogAppender.region, applicationLogAppender.streamName, partitionKey, body);
    } catch(e){
      console.error("applicationLogAppender error", e);
    }
    
  }

  const result = await documentService.putTrackingInfo(body);
  console.log("tracking save", result);
  const response = {
    statusCode: 200,
    body: "ok"
  };
  //console.log("success", body);
  return (null, response);
};
