'use strict';
const documentService = require('../documentMongoDB');
const { applicationLogAppender } = require('../../resources/config.js').APP_PROPERTIES();
const firehose = require('decompany-common-utils').firehose;

module.exports.handler = async (event, context, callback) => {

  const headers = event.headers?event.headers:{}
  const body = event.queryStringParameters?event.queryStringParameters:{};
  console.log("tracking call", body, headers);


  if(!body.id || !body.e){
    console.log("tracking error", "parameter is invaildate")
    return (null, {
      statusCode: 200,
      body: "e"
    })
  }

  if(!body.created){
    body.created = Date.now();
  }

  body.t = Number(body.t)
  body.n = Number(body.n)
  body.referer = headers.Referer;
  body.useragnet = headers["User-Agent"];

  if(applicationLogAppender && applicationLogAppender.enable){
    try{
      await firehose.putRecord("us-east-1", applicationLogAppender.deliveryStream, body);
    } catch(e){
      console.error("applicationLogAppender error", e);
    }
    
  }

  const result = await documentService.putTrackingInfo(body);
  console.log(result);

  const response = {
    statusCode: 200,
    body: ""
  };

  return (null, response);
};
