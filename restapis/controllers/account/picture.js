'use strict';
const {utils, s3} = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  
  const data = JSON.parse(event.body);
  const filename = Date.now();
  if(!data.id) {
    throw new Error("parameter is invalid");
  }
  const key = data.id + "/" + filename;
  const signedUploadUrl = s3.signedUploadUrl("us-west-1", "DEV-PROFILE-PICTURE", key);
  const response = {
    statusCode:200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      success: true,
      signedUploadUrl: signedUploadUrl
    })
  }
  return response;
  
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
