'use strict';
var AWS = require('aws-sdk');
const { s3Config, sqsConfig } = require('decompany-app-properties');
AWS.config.update({region: "us-west-1"});
var sqs = new AWS.SQS();
var QUEUE_URL = sqsConfig.queueUrls.CONVERT_IMAGE;

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
  
  let promises = [];
  await items.forEach((record) => {
    
    
    const key = record.s3.object.key;
    const splits = key.split("/");
    
    const fileid = splits[2].split(".")[0];
    const fileindex = decodeURIComponent(splits[1]);
    const ext = splits[2].split(".")[1];
    
    const data = {
      "fileindex": fileindex,
      "fileid": fileid,
      "ext": ext
    }
  
    const messageBody = generateMessageBody(data);
    const message = {
      QueueUrl: QUEUE_URL,
      MessageBody: messageBody
    }
    console.log(message);
    promises.push(sendMessage(message));
    

  });

  return await Promise.all(promises).then((results) => {
    console.log("send sqs success", results.length);
  }).catch((errs)=>{
    console.error("error", results);
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
  messageBody.resolutionX = 1200;
  messageBody.resolutionY = 1200;
  messageBody.startPage = 1;
  messageBody.endPage = 10;
  messageBody.accesskey = "";
  messageBody.secretKey = "";
  messageBody.ext = param.ext;
  messageBody.owner = param.fileindex;
  return JSON.stringify(messageBody);
}
