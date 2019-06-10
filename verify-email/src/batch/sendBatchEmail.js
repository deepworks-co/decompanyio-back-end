'use strict';
const { mongodb, tables } = require('decompany-app-properties');
const {MongoWapper, ses, utils} = require('decompany-common-utils');
const { sesConfig } = require('decompany-app-properties');
const fs = require("fs");
const path = require("path");
const BATCH_LIMIT = sesConfig.batchLimit;

const TB_SEND_EMAIL = tables.SEND_EMAIL;
module.exports.handler = async (event, context, callback) => {

  const unsendEmail = await getUnsendEmail(BATCH_LIMIT);
  
  if(unsendEmail.length === undefined || unsendEmail.length===0){
    console.log("A Email is not exists to send!")
    return JSON.stringify({
      success:true
    })
  }
  console.log("unsendEmail", unsendEmail);
  const promises = unsendEmail.map(async (it)=>{    
    const {emailType} = it;

    if("WELCOME" === emailType){
      return await sendWelcomEmail(it);
    } else {
      return await sendFailNoTemplate(it);
    }

  });
  
  const results = await Promise.all(promises);
  console.log(results);
  const response = JSON.stringify({
    success: true
  });

  return response;

};

function getTemplateBody(relativePath){
  
  let resolved;
  if (process.env.LAMBDA_TASK_ROOT) {
    resolved = path.resolve(process.env.LAMBDA_TASK_ROOT, relativePath)
  } else {
    resolved = path.resolve(__dirname, relativePath)
  }
  console.log("process.env.LAMBDA_TASK_ROOT", process.env.LAMBDA_TASK_ROOT);
  console.log("__dirname", __dirname);
  console.log("templatePath", relativePath);
  console.log("resolved", resolved);

  const templateBody = fs.readFileSync(resolved, 'utf8');

  return templateBody;
}

/**
 * getting unsend email
 */
async function getUnsendEmail(limit){
  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const unsendemails = await wapper.findAll(TB_SEND_EMAIL, {sent: {$exists: false}}, {created: 1}, limit);

    return unsendemails;
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}

async function updateSendEmail(it, result){
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const r = await wapper.update(TB_SEND_EMAIL, {email: it.email, emailType: it.emailType}, {
      $set: {
        sent: Date.now(),
        result: result
      }
    });
    console.log("updateSendEmail at mongodb", it, r);
    return r;
  }catch(e){
    console.error(e);
    throw e;
  } finally{
    wapper.close();
  }
  
}
async function sendFailNoTemplate(it){

  return await updateSendEmail(it, {reason: "send fail, no template"});
}

async function sendWelcomEmail(it, result) {
  try{
    const { sender, region, templates } = sesConfig;
    const {title, templatePath} = templates.welcomeEmail;
    const email = it.email;

    const templateBody = getTemplateBody(templatePath);
    let html = templateBody.replace("##email##", email);
    html = html.replace("##title##", title);

    const result = await ses.sendMail(region, email, sender, title, html);
    console.log("send mail", it, result);

    return await updateSendEmail(it, result);
    
  } catch(err){
    console.log(err);
    throw err;
  } 

}