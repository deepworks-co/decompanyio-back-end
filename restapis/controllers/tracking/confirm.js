'use strict';
const documentService = require('../document/documentMongoDB');
const { sesConfig } = require('../../resources/config.js').APP_PROPERTIES();
const {ses, utils} = require('decompany-common-utils');
const fs = require("fs");
const path = require("path");

module.exports.handler = async (event, context, callback) => {
  const { documentId, email, cid, sid } = event.body;
  const { sender, region, template } = sesConfig;

  if(!documentId || !email || !cid || !sid ){
    throw new Error("parameter is invalid!!!");
  }

  if(!utils.validateEmail(email)){
    return "invalidate email";
  }

  await documentService.putTrackingUser(cid, sid, documentId, email);

  let resolved;
  if (process.env.LAMBDA_TASK_ROOT) {
    resolved = path.resolve(process.env.LAMBDA_TASK_ROOT, template)
  } else {
    resolved = path.resolve(__dirname, template)
  }
  console.log("resolved", resolved, __dirname);
  const html = fs.readFileSync(resolved, 'utf8')

  console.log("html", html);

  const check = await documentService.checkTrackingConfirmSendMail(documentId, email);
  console.log("check", check);
  if(check){
    const result = await ses.sendMail(region, email, sender, "Join Polairs Share", html);
    await documentService.putTrackingConfirmSendMail(documentId, email, result);
    console.log("send mail success", result);
  }
  
  
  return "success";

};
