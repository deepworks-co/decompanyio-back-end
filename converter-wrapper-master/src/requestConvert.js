'use strict';
const AWS = require('aws-sdk');
const QUEUE_IMAGE_URL = "https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-convert-image";
const QUEUE_PDF_URL = "https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-pdf-converter";

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

    return true;
  });

  return await Promise.all(promises).then((results) => {
    console.log("send sqs success", results);
  }).catch((errs)=>{
    console.error("error", errs);
  });

}

function sendMessage(message) {

  const sqs = new AWS.SQS({region:"us-west-1"});

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
    QueueUrl: QUEUE_PDF_URL,
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
    QueueUrl: QUEUE_IMAGE_URL,
    MessageBody: JSON.stringify(messageBody)
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