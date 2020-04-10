'use strict';
const documentService = require('../document/documentMongoDB');
const { sesConfig } = require('decompany-app-properties');
const {ses, utils} = require('decompany-common-utils');


module.exports.handler = async (event, context, callback) => {
  console.log('event', JSON.stringify(event))

  const { documentId, email } = event.body;
  const cookie = utils.parseCookie(event.cookie);
  const { sender, region, template } = sesConfig;
  const cid = cookie._cid;
  const sid = cookie._sid
  if(!documentId || !email || !cid || !sid){
    throw new Error("parameter is invalid!!!");
  }

  if(!utils.validateEmail(email)){
    throw new Error('Invalid email address.')
    /*
    return JSON.stringify({
      success: false,
      message: "Invalid email address."
    });
    */
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
  const response = JSON.stringify({
    success: true
  })
  
  return response;

};
