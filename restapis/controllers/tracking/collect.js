'use strict';
const documentService = require('../documentMongoDB');
const { applicationLogAppender } = require('../../resources/config.js').APP_PROPERTIES();
const firehose = require('decompany-common-utils').firehose;

module.exports.handler = async (event, context, callback) => {

  const headers = event.headers?event.headers:{}
  const body = event.queryStringParameters?event.queryStringParameters:{};
  console.log("tracking call", body, headers);


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

  if(applicationLogAppender && applicationLogAppender.enable){
    try{
      console.log("logging kinesis firehose...");
      await firehose.putRecord("us-east-1", applicationLogAppender.deliveryStream, body);
    } catch(e){
      console.error("applicationLogAppender error", e);
    }
    
  }
  await documentService.putTrackingUser({
    cid: body.cid,
    sid: body.sid,
    e: body.e,
    created: Date.now()
  });

  const result = await documentService.putTrackingInfo(body);

  const response = {
    statusCode: 200,
    body: "ok"
  };

  return (null, response);
};
