'use strict';
const { mongodb, tables } = require('decompany-app-properties');
const {MongoWapper, ses, utils} = require('decompany-common-utils');
const { sesConfig } = require('decompany-app-properties');
const MailComposer = require('nodemailer/lib/mail-composer');
const fs = require("fs");
const path = require("path");
const BATCH_LIMIT = sesConfig.batchLimit;
module.exports.handler = async (event, context, callback) => {

  const { sender, region, templates } = sesConfig;
  const now = Date.now();
  const start = utils.getBlockchainTimestamp(new Date(now - 1000 * 60 * 60 * 24 * 1));
  const end = utils.getBlockchainTimestamp(new Date(now));
  const sendList = await getSavedEmails(start, end);
  
  if(sendList.length === undefined || sendList.length===0) {
    console.log("A Email is not exists to send!")
    return JSON.stringify({
      success:true
    });
  }
  //console.log("sendList", sendList);
  const promises = sendList.map(async (it)=>{    
    //console.log("email", );
    return `${it.email}, ${it.created}, ${it.sent?it.sent:""}, ${it.verify?it.verify:false}, ${it.verified?it.verified:""}`;
  });
  
  const results = await Promise.all(promises);
  //const buffer = results.join('\r\n').toString('binary');

  const title = `Polaris Share Aboutus - ${new Date(start)} ~ ${new Date(end)} 기간동안 수집된 이메일 입니다.`
  const mailOptions = {
    from: "connect@decompany.io", 
    to: "jay@decompany.io",
    subject: title,
    text: title + "\r\n다운로드 하세요~\r\n",
    attachments: [
      {
        filename: 'emails.csv',
        content: results.join('\r\n')
      }
    ]
  }
  const buffer = await buildMessage(mailOptions);
  const sendEmailResult = await ses.sendRawMail(region, buffer);
  console.log("sendEmailResult", sendEmailResult);
  const response = JSON.stringify({
    success: true
  });

  return response;

};

async function buildMessage(mailOptions){
  return new Promise((resolve, reject)=>{
    const mail = new MailComposer(mailOptions);
    mail.compile().build((err, message)=>{
      if(err){
        reject(err);
      } else {
        resolve(message);
      }
    });
  });

}

/**
 * getting unsend email
 */
async function getSavedEmails(start, end){
  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    
    const query = {$and: [{created: {$gte: start}}, {created: {$lt: end}}]}
    console.log("query", JSON.stringify(query));
    const sendList = await wapper.findAll(tables.VERIFY_EMAIL, query, {created: 1});

    return sendList;
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}
