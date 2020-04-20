'use strict';
const documentService = require('../document/documentMongoDB');
const { applicationLogAppender } = require('decompany-app-properties');;
const {kinesis, utils} = require('decompany-common-utils');
//const geoip = require('geoip-lite');
const helpers = require('../eventHelpers');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source && event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({success: true, message: 'Lambda is warm!'});
  }

  try{
    console.log('event', JSON.stringify(event))
    const eventParams = utils.parseLambdaEvent(event)
    console.log('Lambda Event', JSON.stringify(eventParams))

    const headers = eventParams.headers;
    const body = eventParams.params;
    const cookie = eventParams.cookie;
    const origin = headers.origin;
    
    if(Object.keys(headers).length === 0 || !body.id || isNaN(body.n)){
      console.error("tracking error", "parameter is invalid", body);
      throw new Error("no collecting")
    }
    const trackingIds = utils.generateTrackingIds(cookie);

    const trackingData = Object.assign(body, {
      cid: trackingIds._cid,
      sid: trackingIds._sid,
      n: Number(body.n), // string->number
      headers,
      created: Date.now()
    })

    if(trackingData.e && !utils.validateEmail(trackingData.e)){
      delete trackingData.e;
    }

    const result = await documentService.putTrackingInfo(trackingData);
    //console.log("tracking save", JSON.stringify(result));
    const user = await documentService.getTrackingUser(trackingData.cid);
    
    if(user && user._id){
      delete user._id;
    }

    const response = utils.makeResponse(JSON.stringify({
      success: true,
      message: "ok",
      user: user
    }), utils.makeTrackingCookie(trackingIds, origin));

    await helpers.saveEvent(Object.assign(makeDownloadEventParamsLambdaProxy(eventParams, event), {trackingIds}), documentService.WRAPPER)

    return response
  } catch(err){
    console.error(err);
    throw err
  }
  
};

function makeDownloadEventParamsLambdaProxy(eventParams, event){

  const {path, method, cookie, headers} = eventParams;
  
  return {
    type: "VIEW",
    path: path,
    method: method,
    headers: headers,
    payload: eventParams.params,
    eventSrc: event
  }
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