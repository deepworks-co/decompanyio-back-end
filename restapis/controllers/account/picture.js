'use strict';
const {utils, s3} = require('decompany-common-utils');
const { mongodb, tables, s3Config } = require('../../resources/config.js').APP_PROPERTIES();
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const {principalId, query} = event;

  const filename = Date.now();

  const key = principalId + "/" + principalId + "_" + filename;
  const signedUploadUrl = s3.signedUploadUrl("us-west-1", s3Config.profile, key);
  const response = JSON.stringify({
    success: true,
    signedUploadUrl: signedUploadUrl
  })
  return callback(null, response);

};
