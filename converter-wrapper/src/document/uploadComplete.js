'use strict';
const AWS = require('aws-sdk');
const { MongoWrapper, sqs } = require('decompany-common-utils');
const { mongodb, tables, sqsConfig, region } = require('decompany-app-properties');


/**
 * @description S3 event trigger
 * @event s3
 *  - prefix : FILE/
 */
exports.handler = async (event) => {

  const result = await Promise.all(event.Records.map(async (record)=>{
    return await run(record);
  }))

  return JSON.stringify({success: true, result});
    
}

function run(record){

  return new Promise(async (resolve, reject)=>{
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);
    
    const splits = key.split("/");
    const documentId = splits[2].split(".")[0];
    const userId = decodeURIComponent(splits[1]);

    const ext = splits[2].split(".")[1];

    const r = await updateContentType(bucket, key, ext);
    console.log("updateContentType", r);

    const uploadCompleteResult = await uploadComplete(documentId);
    console.log("uploadComplete", documentId, uploadCompleteResult);
    
    console.log(region, sqsConfig.queueUrls.CONVERT);
    const sendSQSResult = await sqs.sendMessage(region, sqsConfig.queueUrls.CONVERT, JSON.stringify(makeSQSMessage({
      bucket: bucket,
      userId: userId,
      documentId: documentId,
      ext: ext,
      targetBucket: bucket
    })))
    console.log("send message sqs", sendSQSResult);

    resolve({success: true});
  })

}


function makeSQSMessage({bucket, documentId, userId, ext, targetBucket}){

  const messageBody = {
    source: {
      bucket: bucket,
      key: `FILE/${userId}/${documentId}.${ext}`
    },
    target: {
      bucket: targetBucket,
      //key: `PDF/${param.fileid}/${param.fileid}.pdf`
    }
  }
  
  return messageBody
 
}

async function uploadComplete(documentId){
  const wapper = new MongoWrapper(mongodb.endpoint);
  try{
    return await wapper.update(tables.DOCUMENT, {_id: documentId}, {$set: {state: "UPLOAD_COMPLETE"}});
  }catch(ex){
    console.log("uploadComplete", ex);
  } finally{
    wapper.close();
  }
  
}

function updateContentType(bucket, key, ext){
  
  const s3 = new AWS.S3();

  return new Promise((resolve, reject) => {

    let contentType = "application/octet-stream";
    
    s3.copyObject({
      Bucket: bucket,
      Key: key,
      CopySource: bucket + "/" + key,
      CacheControl: "no-cache",
      ContentType: contentType,
      MetadataDirective: 'REPLACE'
    }, function(err, data){
      if(err) reject(err);
      else resolve(data);
    });
  })

}


function putFileToCABucket(source, target){
  console.log("putFileToCABucket", source, target);
  return new Promise((resolve, reject)=>{

    getUploadFileBody(source)
    .then((data)=>{
      return putFileToCaBucket(target, data);
    })
    .then((data)=>{
      console.log("complete", data);
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
          console.log("Err getUploadFileBody", err)
        reject(err)
      } else {
        console.log("getUploadFileBody success", source);
        resolve(data.Body);
        
      }
      
    });
  })

}

function putFileToCaBucket(target, body){
  const s3 = new AWS.S3();
  console.log("putFile", target);
  return new Promise((resolve, reject) => {
    s3.putObject({
      Bucket: target.bucket,
      Key: target.key,
      Body: body
    }, function(err, data){
      if(err) { 
        reject(err);
      } else {
        console.log("putFile success", target, data);
        resolve(data);
      }
    });
  })

}
