'use strict';
const documentService = require('../documentMongoDB');
const { applicationLogAppender } = require('../../resources/config.js').APP_PROPERTIES();
const {kinesis} = require('decompany-common-utils');
const geoip = require('geoip-lite');

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
  const geoIp = await getGeoIps(xforwardedfor.split(","));
  console.log("result lookup", geoIp);
 
  body.t = Number(body.t)
  body.n = Number(body.n)
  body.referer = headers.Referer;
  body.useragnet = headers["User-Agent"];
  body.geoIp = geoIp;
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

function getGeoIps(ips){
  console.log("ips", ips);
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
