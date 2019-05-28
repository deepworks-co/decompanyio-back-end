'use strict';
const crypto = require('crypto')
const { mongodb, tables, sesConfig, applicationConfig} = require('decompany-app-properties');
const { utils, MongoWapper} = require('decompany-common-utils');

const TB_VERIFY_EMAIL = tables.VERIFY_EMAIL;

module.exports.handler = async (event, context, callback) => {

  console.log(event);
  const { email, re } = event.body;
  const referer = event.headers?event.headers.Referer:undefined;

  if(!email){
    throw new Error("parameter is invalid!!!");
  }

  if(!utils.validateEmail(email)){
    return JSON.stringify({
      success: false,
      message: "invalid email"
    });
  }

  if(!referer || referer.indexOf(applicationConfig.mainHost)<0){
    throw new Error(`referer is wrong!! ${referer}`);
  }

  const created = Date.now();
  const sourceCode = `${email}|${created}`;
  const verifyCode = getVerifyCode(sourceCode);

  console.log(`${email}'s verify code ${verifyCode}`);

  const verifyRequest = await getVerifyRequest(email);
  
  if(verifyRequest && verifyRequest._id) {
    console.log("verifyRequest", verifyRequest);
    throw new Error(`already exists ${email}`);
  }
  
  //사실 실행되지 않음 ㅎㅎㅎㅎ
  if(verifyRequest && verifyRequest.verify === true){
    throw new Error(`already verified ${email}`);
  }
  
  const verifyUrl = getVerifyUrl(sesConfig.templates.verifyEmail.verifyUrl, verifyCode);

  const request = {
    _id: verifyCode, 
    email: email,
    recommender: re,
    verifyUrl: verifyUrl,
    created: created
  }

  const result = await putVerifyEmailRequest(request);
  
  console.log("putVerifyEmailRequest", result);
  const response = JSON.stringify({
    success: true
  });

  return response;

};

async function putVerifyEmailRequest(params){
  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const result = await wapper.save(TB_VERIFY_EMAIL, params);

    return result;
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}

async function getVerifyRequest(email){

  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const result = await wapper.find(TB_VERIFY_EMAIL, {email: email}, {created: -1}, 1);

    return result[0];
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }

}

function getVerifyCode(source){
    const shasum = crypto.createHash('sha1');
    shasum.update(source);
    return shasum.digest('hex');
}

function getVerifyUrl(host, verifyCode){
  let verifyUrl = host;
  if(host.slice(-1) !== "/"){
    verifyUrl += "/";
  }
  verifyUrl += verifyCode;
  
  return verifyUrl;
}