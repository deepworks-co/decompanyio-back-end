'use strict';
const documentService = require('../document/documentMongoDB');
const { sesConfig } = require('decompany-app-properties');
const {ses, utils} = require('decompany-common-utils');


module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source && event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({success: true, message: 'Lambda is warm!'});
  }
  //console.log('event', JSON.stringify(event);
  const eventParams = utils.parseLambdaEvent(event)
  //console.log('eventParams', eventParams)

  const headers = eventParams.headers?eventParams.headers:{};
  const body = eventParams.params?eventParams.params:{};
  const cookie = eventParams.cookie?eventParams.cookie:{};
  const origin = headers.origin;
  
  const { documentId, email } = body;
  console.log(typeof(body), documentId, email)
  const { sender, region, template } = sesConfig;
  const cid = cookie._cid;
  const sid = cookie._sid;
  
  if(!documentId || !email || !cid || !sid){
    throw new Error("parameter is invalid!!!");
  }

  if(!utils.validateEmail(email)){
    throw new Error('Invalid email address.')
  }
  await documentService.putTrackingUser(cid, sid, documentId, email);
  /*
  const check = await documentService.checkTrackingConfirmSendMail(documentId, email);
  console.log("checkTrackingConfirmSendMail", check);
  if(check){
    await documentService.putTrackingConfirmSendMail(documentId, email);
    console.log("send mail success");
  }
  */
  /*
  const response = JSON.stringify({
    success: true
  })
  */
  const response = utils.makeResponse(JSON.stringify({
    success: true,
  }), {
    'Access-Control-Allow-Origin': origin?origin:'*'
  });
  console.log('response', response)
  return response

};
