'use strict';
const { mongodb, tables } = require('decompany-app-properties');
const {MongoWapper, ses, utils} = require('decompany-common-utils');
const { sesConfig } = require('decompany-app-properties');
const fs = require("fs");
const path = require("path");
const BATCH_LIMIT = sesConfig.batchLimit;
module.exports.handler = async (event, context, callback) => {

  const { sender, region, templates } = sesConfig;
  const {title, templatePath} = templates.verifyEmail;
  
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

  const sendList = await getSendList(BATCH_LIMIT);
  
  if(sendList.length === undefined || sendList.length===0){
    console.log("A Email is not exists to send!")
    return JSON.stringify({
      success:true
    })
  }
  console.log("sendList", sendList);
  const promises = sendList.map(async (it)=>{    
    const {email} = it;
    const verify_url = it.verifyUrl;
    const verify_code = it._id;
    let html = templateBody.replace("##email##", email);
    html = html.replace("##title##", title);
    html = html.replace("##verify_url##", verify_url);
    //console.log("html", html);
    const result = await ses.sendMail(region, email, sender, title, html);
    console.log("send mail", {region, email, sender, title, html})
    return await completeVerifyEmailConfirmSendMail(it, result);
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
async function getSendList(limit){
  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const sendList = await wapper.findAll(tables.VERIFY_EMAIL, {$and: [{verify: {$exists: false}}, {sent: {$exists: false}}]}, {created: 1}, limit);

    return sendList;
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}

async function completeVerifyEmailConfirmSendMail(sendemail, result) {
  const wapper = new MongoWapper(mongodb.endpoint);

  try{
    console.log("completeTrackingConfirmSendMail", sendemail, result);
    const r = await wapper.update(tables.VERIFY_EMAIL, {_id: sendemail._id}, {
      $set: {
        sent: Date.now(),
        sentResult: result
      }
      
    });
    console.log("completeTrackingConfirmSendMail", r);
    return true;  
    
  } catch(err){
    console.log(err);
    throw err;
  } finally {
    wapper.close();
  }
}