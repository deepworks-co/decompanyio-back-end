'use strict';
const documentService = require('../document/documentMongoDB');
const { sesConfig } = require('../../resources/config.js').APP_PROPERTIES();
const {ses, utils} = require('decompany-common-utils');


module.exports.handler = async (event, context, callback) => {
  const { documentId, email, cid, sid } = event.body;
  const { sender, region, template } = sesConfig;

  if(!documentId || !email || !cid || !sid ){
    throw new Error("parameter is invalid!!!");
  }

  if(!utils.validateEmail(email)){
    return JSON.stringify({
      success: false,
      message: "invalidate email"
    });
  }

  await documentService.putTrackingUser(cid, sid, documentId, email);

  const check = await documentService.checkTrackingConfirmSendMail(documentId, email);
  console.log("checkTrackingConfirmSendMail", check);
  if(check){
    await documentService.putTrackingConfirmSendMail(documentId, email);
    console.log("send mail success");
  }
  
  const response = JSON.stringify({
    success: true
  })
  
  return response;

};
