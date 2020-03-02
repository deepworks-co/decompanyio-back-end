'use strict';
const documentService = require('../document/documentMongoDB');
const { applicationLogAppender } = require('decompany-app-properties');;
const {kinesis, utils} = require('decompany-common-utils');
//const geoip = require('geoip-lite');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source && event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({success: true, message: 'Lambda is warm!'});
  }
  
  console.log(JSON.stringify(event));
  let {headers, query} = event;
  const body = query

  if(!headers || !body.id || !body.cid || !body.sid || !body.t || isNaN(body.n)){
    console.error("tracking error", "parameter is invalid", body);
    return JSON.stringify({
      message: "no collecting"
    })
  }

  if(!body.created){
    body.created = Date.now();
  }
  const xforwardedfor = headers && headers["X-Forwarded-For"]?headers["X-Forwarded-For"]:"";
  //const xforwardedfor = "211.45.65.70, 54.239.154.128";
  const ips = xforwardedfor.split(",").map((ip)=>{
    return ip.replace(/^\s+|\s+$/g,"");
  });
  
  body.t = Number(body.t);
  body.n = Number(body.n);
  if(!utils.validateEmail(body.e)){
    delete body.e;
  }
  
  headers = utils.convertKeysToLowerCase(headers)

  body.referer = headers.Referer?headers.Referer:headers.referer;
  if(headers["user-agent"]){
    body.useragent = headers["user-agent"];
  } else if(headers["useragent"]){
    body.useragent = headers["useragent"];
  }

  body.xforwardedfor = ips;
  /*
  if(ips && ips.length>0){
    body.geo = getCountryByIp(ips);
  }
  */
  body.headers = headers;
  console.log("tracking body", JSON.stringify(body));
  if(applicationLogAppender && applicationLogAppender.enable === true){
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
  const user = await documentService.getTrackingUser(body.cid);
  
  if(user){
    delete user._id;
    console.log("tracking user", user, body.cid);
  } else {
    console.log("tracking user is not exists", body.cid);
  }
  
  
  const response = {
    statusCode: 200,
    Cookie: getCookie(process.env.stage),
    body: JSON.stringify({
      success: true,
      message: "ok",
      user: user
    })
  }
  return response;
};

function getCookie(stage, cookie){
  const timestamp = Date.now()
  const expiredAt = new Date();
  const secend = 30 * 60; //30 mins
  expiredAt.setTime(expiredAt.getTime() +secend );

  const _sid = cookie && cookie._sid?cookie._sid:utils.randomId();
  const domain = stage === ('alpha'||'asem')?"polarishare.com":"share.decompany.io";
  return `_sid=${_sid}.${timestamp}; domain=${domain};expires=${expiredAt.toGMTString()};max-age=${secend}; path=/; Secure; HttpOnly;`
}

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