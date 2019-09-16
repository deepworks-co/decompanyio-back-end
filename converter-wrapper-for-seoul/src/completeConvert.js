'use strict';
const AWS = require('aws-sdk');
module.exports.handler = async (event, context, callback) => {
  
  const promises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);

    return copyFile({bucket, key}, {bucket: "asem-ko-document", key: key});
  });

  const results = await Promise.all(promises);
  return callback(null, JSON.stringify({success: true}));
};


function copyFile(source, target){
  const s3 = new AWS.S3();

  return new Promise((resolve, reject) => {
    s3.copyObject({
      Bucket: target.bucket,
      Key: target.key,
      CopySource: source.bucket + "/" + source.key,
    }, function(err, data){
      if(err) reject(err);
      else resolve(data);
    });
  })
}