'use strict';
const crypto = require('crypto')
const { mongodb, tables, sesConfig, applicationConfig} = require('decompany-app-properties');
const { utils, MongoWapper} = require('decompany-common-utils');

const TB_VERIFY_EMAIL = tables.VERIFY_EMAIL;

module.exports.handler = async (event, context, callback) => {

  console.log(event);
  const { code } = event.path;
  const referer = event.headers?event.headers.Referer:undefined;

  if(!code){
    throw new Error("parameter is invalid!!!");
  }

  const verifyRequest = await getVerifyRequest(code);

  if(!verifyRequest){
    //throw new Error(`No Verify Request  : ${code}`)
    return JSON.stringify({
      success: false,
      message: `No Verify Request`
    })
  }

  if(verifyRequest.verify){
    //throw new Error(`already verified  : ${code}`)
    return JSON.stringify({
      success: false,
      message: `already verified`
    })
  }

  const result = await verifyEmail({_id: verifyRequest._id, referer: referer});
  console.log("verifyEmail", result);
  
  const response = JSON.stringify({
    success: true,
    message: "verified"
  })
    
  return response;

};


async function getVerifyRequest(code){

  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const result = await wapper.find(TB_VERIFY_EMAIL, {_id: code}, {created:- 1}, 1);

    return result[0];
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }

}
async function verifyEmail(params){
  const wapper = new MongoWapper(mongodb.endpoint);
    
  try{
    const result = await wapper.update(TB_VERIFY_EMAIL, {_id: params._id}, {
      $set: {
        verify: true,
        verified: Date.now(),
        verifiedReferer: params.referer
      }
    });

    return result;
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}