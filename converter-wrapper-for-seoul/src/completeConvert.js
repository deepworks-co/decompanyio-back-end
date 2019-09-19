'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const DOCUMENT_BUCKET = "jpdev-jp-document"
module.exports.handler = async (event, context, callback) => {
  
  const promises = event.Records.map(async (record) => {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);
    return await putFileToOrignBucket({bucket, key}, {bucket: DOCUMENT_BUCKET, key: key});
  });

  const results = await Promise.all(promises);
  return callback(null, JSON.stringify({success: true}));
};


function putFileToOrignBucket(source, target){
  console.log("putFile", source, target);
  return new Promise((resolve, reject)=>{

    getUploadFileBody(source)
    .then((data)=>{
      //console.log(data);
      return putFile(target, data);
    })
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })

  }) 
}


function getUploadFileBody(source){
  return new Promise((resolve, reject) => {
    
    s3.getObject({
      Bucket: source.bucket,
      Key: source.key
    }, function(err, data){
      if(err) {
        console.log(err);
        reject(err);
      } else {
        //console.log("getUploadFileBody", data)
        resolve(data.Body);
      }
    });
  })

}

function putFile(target, body){
  return new Promise((resolve, reject) => {
    s3.putObject({
      Bucket: target.bucket,
      Key: target.key,
      Body: body
    }, function(err, data){
      if(err) reject(err);
      else resolve(data);
    });
  })

}