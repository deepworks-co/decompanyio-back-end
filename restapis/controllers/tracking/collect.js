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

  try{
    console.log(JSON.stringify(event));
    const eventParams = utils.parseLambdaEvent(event)
    const headers = eventParams.headers;
    const body = eventParams.params;
    const cookies = eventParams.cookies;
    const origin = headers.origin;
    
    if(Object.keys(headers).length === 0 || !body.id || isNaN(body.n)){
      console.error("tracking error", "parameter is invalid", body);
      throw new Error("no collecting")
    }

    if(!body.created){
      body.created = Date.now();
    }
    const xforwardedfor = headers && headers["x-forwarded-for"]?headers["x-forwarded-for"]:"";
    //const xforwardedfor = "211.45.65.70, 54.239.154.128";
    const ips = xforwardedfor.split(",").map((ip)=>{
      return ip.replace(/^\s+|\s+$/g,"");
    });
    
    body.t = Date.now();
    body.n = Number(body.n);
    if(!utils.validateEmail(body.e)){
      delete body.e;
    }

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
    //console.log("tracking body", JSON.stringify(body));
    /*
    if(applicationLogAppender && applicationLogAppender.enable === true){
      try{
        const partitionKey = "tracking-" + Date.now();
        console.log("put kinesis", applicationLogAppender.region, applicationLogAppender.streamName, partitionKey);
        await kinesis.putRecord(applicationLogAppender.region, applicationLogAppender.streamName, partitionKey, body);
      } catch(e){
        console.error("applicationLogAppender error", e);
      }
      
    }
    */

    const result = await documentService.putTrackingInfo(body);
    //console.log("tracking save", JSON.stringify(result));
    const user = await documentService.getTrackingUser(body.cid);
    
    if(user){
      delete user._id;
      //console.log("tracking user", user, body.cid);
    } else {
      //console.log("tracking user is not exists", body.cid);
    }

    const trackingIds = utils.generateTrackingIds(cookies);

    const response = utils.makeResponse(JSON.stringify({
      success: true,
      message: "ok",
      user: user
    }), utils.makeTrackingCookie(trackingIds, origin));

    return response
  } catch(err){
    console.error(err);
    throw err
  }
  
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