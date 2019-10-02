'use strict';
const AWS = require('aws-sdk');
const { MongoWapper } = require('decompany-common-utils');
const { mongodb, tables, sqsConfig, region } = require('decompany-app-properties');
const QUEUE_URL = sqsConfig.queueUrls.CONVERT_IMAGE;
const s3 = new AWS.S3();


/**
 * @description S3 event trigger
 * @event s3
 *  - prefix : FILE/
 */
exports.handler = function(event, context, callback) {
  
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  run(event.Records).then((success)=>{
    console.log("success message", success);
    callback(null, "success")
  }).catch((err)=>{
    callback(err);
  });
  
  
}

async function run(items){

  const promises = await items.map(async (record) => {
    
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key);
    
    const splits = key.split("/");
    const fileid = splits[2].split(".")[0];
    const fileindex = decodeURIComponent(splits[1]);

    const ext = splits[2].split(".")[1];

    const r = await updateContentType(bucket, key, ext);
    console.log("updateContentType", r);

    const uploadCompleteResult = await uploadComplete(fileid);
    console.log("uploadComplete", fileid, uploadCompleteResult);

    /*
    const sqsMessage = {
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify({
        source: {
          bucket: bucket,
          key: key
        },
        target: {
          bucket: "asem-ca-upload-document",
          key: key
        }
      })
    }
    const r2 = await sendMessage(sqsMessage);
    console.log("sendMessage", r2);
    */

    const r2 = await putFileToCABucket({
      bucket: bucket,
      key: key
    }, {
      bucket: "asem-ca-upload-document",
      key: key
    });
    console.log("putFileToCABucket", r2);
   
    /*
    const data = {
      bucket: bucket,
      fileindex: fileindex,
      fileid: fileid,
      ext: ext
    }
    
    const r2 = await sendMessage(generateMessageBody(data));
    console.log("sendMessage", r2);
    
    const r3 = await sendMessage(generatePDFMessageBody(data));
    console.log("sendMessage", r3);
    */
    return true;
  });

  return await Promise.all(promises).then((results) => {
    console.log("send sqs success", results);
  }).catch((errs)=>{
    console.error("error", errs);
  });

}

function sendMessage(message) {
  console.log("sendMessage", sqsConfig.region)
  console.log("sendMessage", message);
  const sqs = new AWS.SQS();

  return new Promise((resolve, reject)=>{
    //console.log("sendMessage", message);

    sqs.sendMessage(message, function(err, res) {
      if(err){
        //console.error("error",err);
        reject(err);
      } else {
        //console.error("result", res);
        resolve(res);
      }
    });

  });
}

const generatePDFMessageBody = function(param){

  //const bucket = s3Config.document;
  const bucket = param.bucket;

  const messageBody = {
    source: {
      bucket: bucket,
      key: `FILE/${param.fileindex}/${param.fileid}.${param.ext}`
    },
    target: {
      bucket: bucket,
      key: `PDF/${param.fileid}/${param.fileid}.pdf`
    }
  }
  
  return {
    QueueUrl: sqsConfig.queueUrls.CONVERT_PDF,
    MessageBody: JSON.stringify(messageBody)
  }
 
}

const generateMessageBody = function(param){

  //const bucket = s3Config.document;
  const bucket = param.bucket;

  var messageBody = new Object();
  messageBody.command="image";
  messageBody.filePath = bucket + "/FILE/"+ param.fileindex +"/" + param.fileid + "." + param.ext;
  messageBody.storagePath = bucket + "/THUMBNAIL/" + param.fileid;
  messageBody.resolutionX = 1920;
  messageBody.resolutionY = 1920;
  messageBody.startPage = 1;
  messageBody.endPage = 10;
  messageBody.accesskey = "";
  messageBody.secretKey = "";
  messageBody.ext = param.ext;
  messageBody.owner = param.fileindex;
  return {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(messageBody)
  }
}

async function uploadComplete(documentId){
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    return await wapper.update(tables.DOCUMENT, {_id: documentId}, {$set: {state: "UPLOAD_COMPLETE"}});
  }catch(ex){
    console.log("uploadComplete", ex);
  } finally{
    wapper.close();
  }
  
}

function updateContentType(bucket, key, ext){
  console.log(bucket, key, ext, region);
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