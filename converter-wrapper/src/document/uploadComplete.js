'use strict';
const AWS = require('aws-sdk');
const { MongoWapper } = require('decompany-common-utils');
const { mongodb, tables, s3Config, sqsConfig, region } = require('decompany-app-properties');
AWS.config.update({region: region});
const sqs = new AWS.SQS();
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
  
  //console.log("uploadComplete Event", JSON.stringify(event));
  
  // key : FILE/anonymous%40infrawareglobal.com/12a3b909-ec42-4ac2-b0e0-3b01c6ccd77e.hwp
  // %40 => @
  run(event.Records).then((success)=>{
    //console.log("success message", success);
    context.done(null, "success")
  }).catch((err)=>{
    context.done(err);
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

    const data = {
      "fileindex": fileindex,
      "fileid": fileid,
      "ext": ext
    }

    const uploadCompleteResult = await uploadComplete(fileid);
    console.log("uploadComplete", fileid, uploadCompleteResult);
        
    const messageBody = generateMessageBody(data);
    const message = {
      QueueUrl: QUEUE_URL,
      MessageBody: messageBody
    }
    
    const r2 = await sendMessage(message);
    console.log("sendMessage", message, r2);
    

    return true;
  });

  return await Promise.all(promises).then((results) => {
    console.log("send sqs success", results);
  }).catch((errs)=>{
    console.error("error", errs);
  });

}

function sendMessage(message) {
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

const generateMessageBody = function(param){

  const bucket = s3Config.document;
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
  return JSON.stringify(messageBody);
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
  console.log(bucket, key, ext);
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


