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
      //console.log(jobId, workDir);
      makeParameter(jobId, workDir)
      .then((data) => downloadFile(data))
      .then((data)=>convertPdf(data))
      //.then((data)=>uploadPdf(data))
      .then((data)=>uploadPdfBase64(data))
      .then((data)=>completeJob(data))
      .catch((err)=>clearErrorJob(err))
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

  async function makeParameter(jobId, workDir){
    return new Promise(async (resolve, reject)=>{
      try{
        status.addJob(jobId);
        const msg = await getsqsmessage();
        const {MessageId, ReceiptHandle, Body, MD5OfBody} = msg;
        const parsedMessage = parseMessage(Body)
        console.log("get sqs message", JSON.stringify(parsedMessage));
        resolve({
          startAt: Date.now(),
          jobId,
          workDir,
          sqsmessage: parsedMessage
        })
      }catch(err){
        if(err) console.error("Error makeParameter", err);
        reject({jobId, workDir, err})
      }
      
    });
    
  }
  
  async function downloadFile(data) {
    const {workDir, jobId, sqsmessage} = data; 
    const {source} = sqsmessage;
    console.log("downloadFile", JSON.stringify(data));
    return new Promise(async (resolve, reject)=>{
      try{
        const result = await filewrapper.dowloadFromS3(workDir, source.bucket, source.key)

        resolve(Object.assign({  
          downloadPath: result.downloadPath,
          extname: result.extname,
          filename: result.filename,
        }, data))
      }catch(err){
        console.error("Error downloadFile", err);
        reject({err, workDir, jobId});
      }
      
    })
    

  }

  async function convertPdf(data){
    
    const {downloadPath, extname, filename, sqsmessage, workDir, jobId} = data;

    return new Promise(async (resolve, reject)=>{
      try{
        console.log("convertPdf", JSON.stringify(data));
        
        let outputPath = `${workDir}/temp.pdf`;
        
        if(extname && extname.toLowerCase() === ".pdf" ){
          outputPath = downloadPath;
          const response = Object.assign({
              outputPath,
              downloadPath
          }, data);
          
          resolve(response);
        } else {
           //const outputPath = `${workDir}/temp.pdf`;
          const payload = {w: "1280", h: "1280", outputPath, downloadPath};
          const params = Object.assign(payload, data);
      
          const r = await pdfconverter(params);
          
          resolve(params);
        }
       
      } catch(err){
        console.error("Error convertPdf", err);
        reject({err, jobId, workDir});
      }
    });
    
    
  }

  async function uploadPdf(data){
    console.log("uploadPdf", JSON.stringify(data));
    
    const {workDir, jobId, outputPath, sqsmessage} = data
    //upload pdf
    return new Promise(async (resolve, reject)=>{
      try{
        const {target} = sqsmessage;
        const r = await filewrapper.uploadToS3(outputPath, target.bucket, target.key)
        resolve(data);
      } catch(err){
        console.log(err);
        reject({workDir, jobId, err});
      }
      
    })
    
  }

  async function uploadPdfBase64(data){
    console.log("uploadPdfBase64", JSON.stringify(data));
    //upload base64 pdf
    const {workDir, jobId, outputPath, sqsmessage} = data
    const {target} = sqsmessage;
    return new Promise(async (resolve, reject)=>{
      try{
        const targetBase64Key = target.key.substring(0, target.key.lastIndexOf("."));
        const r = await filewrapper.uploadToS3(outputPath, target.bucket, targetBase64Key, true);
        resolve(data);
      }catch(err){
        reject({jobId, workDir, err});
      }
    })
    
    
  }
  async function completeJob(data){
    const {startAt, jobId, workDir} = data
    return new Promise((resolve, reject)=>{
      clearJob(data);
      
      const workingDuration = startAt?(Date.now() - startAt): -1;
      console.log(`process complete ${jobId} ${workingDuration}ms`);
    })

  }
  async function clearJob(data){
    console.error("clearJob", JSON.stringify(data));
    const {jobId, workDir} = data
    status.removeJob(jobId);
    filewrapper.deleteDir(workDir);
    
  }

  async function clearErrorJob(data){
    
    const {jobId, workDir, err} = data
    if(jobId) status.removeJob(jobId);
    if(workDir) filewrapper.deleteDir(workDir);
    if(err) console.error("clearErrorJob", err);
  }