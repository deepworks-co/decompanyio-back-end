'use strict';
const documentService = require('../documentMongoDB');
const { applicationLogAppender } = require('../../resources/config.js').APP_PROPERTIES();
const {kinesis} = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {
  //console.log(JSON.stringify(event));
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
  const xforwardedfor = headers["X-Forwarded-For"]?headers["X-Forwarded-For"]:"";
  //const xforwardedfor = "211.45.65.70, 54.239.154.128";
  const ips = xforwardedfor.split(",").map((ip)=>{
    return ip.replace(/^\s+|\s+$/g,"");
  });
  
  body.t = Number(body.t);
  body.n = Number(body.n);
  body.referer = headers.Referer;
  body.useragnet = headers["User-Agent"];
  body.xforwardedfor = ips;
  body.headers = headers;
  //console.log("tracking body", body);
  if(applicationLogAppender && applicationLogAppender.enable){
    try{
      const partitionKey = "tracking-" + Date.now();
      console.log("put kinesis", applicationLogAppender.region, applicationLogAppender.streamName, partitionKey);
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

/*
* geoip-lite 는 용량문제로 lambda에 업로드 되지 않음.... 줸장...
function getGeoIps(ips){
  const returnValues = [];
  ips.forEach((ip) => {
    const geo = geoip.lookup(ip.replace(/^\s+|\s+$/g,""));
    console.log("lookup", ip, geo);
    if(geo){
      returnValues.push({ip: ip, geo: geo});
    }
   
  });

  return returnValues;
}
*/