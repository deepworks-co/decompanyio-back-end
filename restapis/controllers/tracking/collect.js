'use strict';
const documentService = require('../document/documentMongoDB');
const { applicationLogAppender } = require('../../resources/config.js').APP_PROPERTIES();
const {kinesis, utils} = require('decompany-common-utils');
//const geoip = require('geoip-lite');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  console.log(JSON.stringify(event));
  const {headers, query} = event;
  const body = query

  if(!body.id || !body.cid || !body.sid || !body.t || isNaN(body.n)){
    console.error("tracking error", "parameter is invalid", body);
    return JSON.stringify({
      message: "no collecting"
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
  if(!utils.vaildateEmail(body.e)){
    delete body.e;
  }
  

  body.referer = headers.Referer;
  body.useragent = headers["User-Agent"];
  body.xforwardedfor = ips;
  /*
  if(ips && ips.length>0){
    body.geo = getCountryByIp(ips);
  }
  */
  body.headers = headers;
  console.log("tracking body", JSON.stringify(body));
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

  const user = await documentService.getTrackingUser(body.cid);
  console.log("tracking save", result);
  const response = JSON.stringify({
    success: true,
    message: "ok",
    user: user
  });
  //console.log("success", body);
  return response;
};


/* 
geoip-lite 는 용량문제로 lambda에 업로드 되지 않음.... 줸장...
그래서  layer로 분리함 ㅎㅎ 
그래도 큼;;; ㅠㅠ

function getCountryByIp(ips){
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