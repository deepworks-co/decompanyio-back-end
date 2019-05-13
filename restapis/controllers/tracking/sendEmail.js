'use strict';
const documentService = require('../document/documentMongoDB');
const {ses, utils} = require('decompany-common-utils');
const { sesConfig } = require('../../resources/config.js').APP_PROPERTIES();
const fs = require("fs");
const path = require("path");
const MAIL_TITLE = "Join Polairs Share";
const BATCH_LIMIT = 10;
module.exports.handler = async (event, context, callback) => {


  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  const { sender, region, template } = sesConfig;
  
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
  const templateBody = fs.readFileSync(resolved, 'utf8');

  const unsendEmail = await documentService.getUnsendEmail(BATCH_LIMIT);
  
  if(unsendEmail.length === 'undefined' || unsendEmail.length===0){
    console.log("A Email is not exists to send!")
    return JSON.stringify({
      success:true
    })
  }
  console.log("unsendEmail", unsendEmail);
  const promises = unsendEmail.map(async (it)=>{    
    const {email} = it;
    let html = templateBody.replace("##email##", email);
    html = html.replace("##title##", MAIL_TITLE);
    //console.log("html", html);
    const result = await ses.sendMail(region, email, sender, title, html);
    console.log("send mail", {region, email, sender, title, html})
    return await documentService.completeTrackingConfirmSendMail(it, result);
  });
  
  const results = await Promise.all(promises);
  console.log(results);
  const response = JSON.stringify({
    success: true
  });

  return response;

};
