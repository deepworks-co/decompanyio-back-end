'use strict';
const {utils} = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  
  const data = JSON.parse(event.body);
  const name = Date.now();
  const key = data.userid + "/" + name;
  const signedUploadUrl = utils.s3.signedUploadUrl("us-west-1", "DC-ACCOUNT-PICTURE", key);
  const response = {
    statusCode:200,
    body: JSON.stringify({
      success: true,
      signedUploadUrl: signedUploadUrl
    })
  }
  return response;
  
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
