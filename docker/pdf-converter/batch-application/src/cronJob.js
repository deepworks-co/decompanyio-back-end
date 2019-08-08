'use strict';
const pdfconverter = require('./pdf-converter-wrapper');
const getsqsmessage = require('./get-convert-message');
const filewrapper = require('./file-wrapper');
const cron = require('node-cron');
const Status = require('./status');
const status = new Status();

let task;
const expressiojn = '*/1 * * * * *'
const WORK_DIR_PREFIX = '/cronwork'
module.exports.init = () => {
    console.log("cron start", expressiojn)
    task = cron.schedule(expressiojn, cronJob);
    return this;
}

module.exports.stop = () => {
  status.stop();
  if(task) task.stop();
}

module.exports.status = () => {
  return status;
}

async function cronJob() {
    //console.log("current status", status);
    if(status.isStop() === true && status.jobCount() === 0) {
      console.log("stopping pdf converter");
    } else if(status.jobCount() < 1 && status.isStop() === false){
      const jobId = `job_${Date.now()}`;
      const workDir = `${WORK_DIR_PREFIX}/${jobId}`;
      //console.log('running for pdf converter cron every 500ms', jobId, workDir);

      getsqsmessage()
      .then(async (sqsmessage)=>{
        
        const {MessageId, ReceiptHandle, Body, MD5OfBody} = sqsmessage;
        const parsedMessage = parseMessage(Body)
        console.log("receive sqs message", JSON.stringify(parsedMessage));
        const {source} = parsedMessage;
        
        status.addJob(jobId);

        const result = await filewrapper.dowloadFromS3(workDir, source.bucket, source.key)
        return {  
          downloadPath: result.downloadPath,
          extname: result.extname,
          filename: result.filename,
          sqsmessage: parsedMessage
        }
      })
      .then(async (data)=>{
        const {downloadPath, extname, filename, sqsmessage} = data;
        let outputPath = `${workDir}/temp.pdf`;
        
        if(extname && extname.toLowerCase() === ".pdf" ){
          outputPath = downloadPath;
          const response = Object.assign({
              outputPath,
              downloadPath
          }, data);
          
          return response;
        }
        //const outputPath = `${workDir}/temp.pdf`;
        const payload = {w: "1280", h: "1280", outputPath, downloadPath};
        const event = Object.assign(payload, data);

        const r = await pdfconverter(event);
        console.log(r);
 
        return event;
      })
      .then(async (data)=>{
        //upload pdf
        const {downloadPath, outputPath, extname, filename, sqsmessage} = data
        const {target} = sqsmessage;
        const r = await filewrapper.uploadToS3(outputPath, target.bucket, target.key)
        return data; 
      })
      .then(async(data)=>{
        //upload base64 pdf
        const {downloadPath, outputPath, extname, filename, sqsmessage} = data
        const {target} = sqsmessage;
        const targetBase64Key = target.key.substring(0, target.key.lastIndexOf("."));
        const r = await filewrapper.uploadToS3(outputPath, target.bucket, targetBase64Key, true);
        return data; 
      }).then((result)=>{
        status.removeJob(jobId);
        filewrapper.deleteDir(workDir);
        console.log("process complete result", result);

      })
      .catch((err)=>{
        filewrapper.deleteDir(workDir);
        status.removeJob(jobId);
        if(err !== 'EmptyMessage') console.error(err);
      })
    }
  }
  
  function parseMessage(Body){
    try{
      return JSON.parse(Body);
    } catch(e){
      console.error(e);
    }
    return {}
  }
  
  