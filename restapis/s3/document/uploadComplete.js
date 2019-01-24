'use strict';
var AWS = require('aws-sdk');
AWS.config.update({region: "us-west-1"});
var sqs = new AWS.SQS();
var QUEUE_URL = 'https://sqs.us-west-1.amazonaws.com/197966029048/DEV-CA-CONVERT-IMAGE';

/**
 * @description S3 event trigger
 * @event s3
 *  - prefix : FILE/
 */
exports.handler = function(event, context) {
  
  //console.log("uploadComplete Event", JSON.stringify(event));
  
  // key : FILE/anonymous%40infrawareglobal.com/12a3b909-ec42-4ac2-b0e0-3b01c6ccd77e.hwp
  // %40 => @
  /*
  sqs.sendMessage({
    QueueUrl: QUEUE_URL,
    MessageBody: "messageBody"
  }, function(err, data){
    if(err){
      console.error("false", err);
    } else {
      console.log("success", data);
    }

  });
  */
  run(event.Records).then((success)=>{
    console.log("success message", success);
    context.done(null, "success")
  }).catch((err)=>{
    context.done(err);
  });
  
  
}
/*
async function run(items){
  let i=0;

  for(i=0;i<items.length;i++){
    const record = items[i];
    
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
    //console.log(message);
    const res = await sendMessage(message);
    console.log("result ",i, res, message);

  }

  return i;
}
*/

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
  /*{"command": "image", "filePath":"dev-ca-document/FILE/doc/1", "storagePath":"dev-ca-document/THUMBNAIL/doc", "resolutionX":1200, "resolutionY":1200,
  "startPage":1, "endPage":10, "ext":"hwp"}*/
  //console.log("param", param);
  var messageBody = new Object();
  messageBody.command="image";
  messageBody.filePath = "dev-ca-document/FILE/"+ param.fileindex +"/" + param.fileid + "." + param.ext;
  messageBody.storagePath = "dev-ca-document/THUMBNAIL/" + param.fileid;
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
