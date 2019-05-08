'use strict';
const documentService = require('../document/documentMongoDB');
const { sesConfig } = require('../../resources/config.js').APP_PROPERTIES();
const {ses, utils} = require('decompany-common-utils');
const fs = require("fs");
const path = require("path");
const title = "Join Polairs Share";

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
  console.log("process.env.LAMBDA_TASK_ROOT", process.env.LAMBDA_TASK_ROOT);
  console.log("__dirname", __dirname);
  console.log("template", template);
  console.log("resolved", resolved);
  let html = fs.readFileSync(resolved, 'utf8')
  
  
  html = html.replace("##email##", email);
  html = html.replace("##title##", title)
  console.log("html", html);
    
  const check = await documentService.checkTrackingConfirmSendMail(documentId, email);
  console.log("checkTrackingConfirmSendMail", check);
  if(check){
    const result = await ses.sendMail(region, email, sender, title, html);
    await documentService.putTrackingConfirmSendMail(documentId, email, result);
    console.log("send mail success", result);
  }
  
  const response = JSON.stringify({
    success: true
  })
  
  return response;

};
