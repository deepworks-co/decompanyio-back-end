'use strict';
const {utils, s3} = require('decompany-common-utils');
const { mongodb, tables, s3Config, region } = require('decompany-app-properties');
module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  console.log(JSON.stringify(event));
  const {principalId} = event;

  const filename = Date.now();

  const key = principalId + "/" + principalId + "_" + filename;
  const signedUploadUrl = s3.signedUploadUrl(region, s3Config.upload_profile, key);
  const response = JSON.stringify({
    success: true,
    signedUploadUrl: signedUploadUrl,
    picture: key
  })

  console.log(response);
  return callback(null, response);

};
