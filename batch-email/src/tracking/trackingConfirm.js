'use strict';
const { mongodb, tables } = require('decompany-app-properties');
const {MongoWapper, ses, utils} = require('decompany-common-utils');
const { sesConfig } = require('decompany-app-properties');
const fs = require("fs");
const path = require("path");
const MAIL_TITLE = "Join Polairs Share";
const BATCH_LIMIT = sesConfig.batchLimit;
module.exports.handler = async (event, context, callback) => {


  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  const { sender, region, templates } = sesConfig;
  const {title, templatePath} = templates.trackingConfirm;
  
  let resolved;
  if (process.env.LAMBDA_TASK_ROOT) {
    resolved = path.resolve(process.env.LAMBDA_TASK_ROOT, templatePath)
  } else {
    resolved = path.resolve(__dirname, templatePath)
  }
  console.log("process.env.LAMBDA_TASK_ROOT", process.env.LAMBDA_TASK_ROOT);
  console.log("__dirname", __dirname);
  console.log("templatePath", templatePath);
  console.log("resolved", resolved);
  const templateBody = fs.readFileSync(resolved, 'utf8');

  const unsendEmail = await getUnsendEmail(BATCH_LIMIT);
  
  if(unsendEmail.length === undefined || unsendEmail.length===0){
    console.log("A Email is not exists to send!")
    return JSON.stringify({
      success:true
    })
  }
  console.log("unsendEmail", unsendEmail);
  const promises = unsendEmail.map(async (it)=>{    
    const {email} = it;
    let html = templateBody.replace("##email##", email);
    html = html.replace("##title##", title);
    //console.log("html", html);

    return true;
    const result = await ses.sendMail(region, email, sender, title, html);
    console.log("send mail", {region, email, sender, title, html})
    return await completeTrackingConfirmSendMail(it, result);
  });
  
  const results = await Promise.all(promises);
  console.log(results);
  const response = JSON.stringify({
    success: true
  });

  return response;

};

/**
 * getting unsend email
 */
async function getUnsendEmail(limit){
  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const unsendemails = await wapper.findAll(tables.TRACKING_CONFIRM, {sent: {$exists: false}}, {created: 1}, limit);

    return unsendemails;
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}

async function completeTrackingConfirmSendMail(unsend, result) {
  const wapper = new MongoWapper(connectionString);
  const now = new Date();
  try{
    console.log("completeTrackingConfirmSendMail", unsend, result);
    unsend.sent = now.getTime();
    unsend.result = result;
    const r = await wapper.save(tables.TRACKING_CONFIRM, unsend);
    console.log("check save result", r);
    return true;  
    
  } catch(err){
    console.log(err);
    throw err;
  } finally {
    wapper.close();
  }
}