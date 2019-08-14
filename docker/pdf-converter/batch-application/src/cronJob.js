'use strict';
const pdfconverter = require('./pdf-converter-wrapper');
const getsqsmessageWrapper = require('./get-convert-message');
const filewrapper = require('./file-wrapper');
const cron = require('node-cron');
const Status = require('./status');
const status = new Status();
const R = require('ramda');
let task;
const expression = process.env.EXPRESSION?process.env.EXPRESSION:'*/1 * * * * *'
const WORK_DIR_PREFIX = process.env.WORK_DIR_PREFIX?process.env.WORK_DIR_PREFIX:'/cronwork'

module.exports.init = (args) => {
  if(args){
    console.log("local start", args)
    /*
    cronJob(args).then((data)=>{
      console.error("cronJob init Result", data);
    })
    .catch((err)=>{
      console.error("cronJob init Error", err);
    })
    */
    return this;
  } else {
    console.log("cron start", expression)
    task = cron.schedule(expression, cronJob);
    return this;
  }
    
}

module.exports.stop = () => {
  status.stop();
  if(task) task.stop();
}

module.exports.status = () => {
  return status;
}

async function cronJob(args) {
    //console.log("current status", status);
    if(status.isStop() === true && status.jobCount() === 0) {
      console.log("stopping pdf converter");
    } else if(status.jobCount() < 1 && status.isStop() === false){
      
      const jobId = `job_${Date.now()}`;
      const workDir = `${WORK_DIR_PREFIX}/${jobId}`;
      //console.log(jobId, workDir);
      /*
      makeParameter(jobId, workDir)
      .then((data) => downloadFile(data))
      .then((data)=>convertPdf(data))
      //.then((data)=>uploadPdf(data))
      .then((data)=>uploadPdfBase64(data))
      .then((data)=>completeJob(data))
      .catch((err)=>clearErrorJob(err))
      */

      const inputParameterFromSQS = R.curry(function(getsqsmessageFunc, jobId, workDir){
        console.log("inputParameterFromSQS");
        return makeParameter(getsqsmessageFunc, jobId, workDir);
      })

      const inputParameterFromArgs = R.curry(function(args, jobId, workDir){
        console.log("inputParameterFromArgs");
        return function(args, jobId, workDir) {
          
          return {
            jobId, workDir,
            sqsmessage: args
          }
        };
      })

      
      try{
        console.log("args", args);
        let inputParameter = args?inputParameterFromArgs(args):inputParameterFromSQS(getsqsmessageWrapper);
        //let inputParameter = args?inputParameterFromArgs:inputParameterFromSQS;
        const converter = R.composeP(completeJob, uploadPdfBase64, convertPdf, downloadFile, inputParameter);
        
        const r = await converter(jobId, workDir)
        console.log("r", r);
      } catch(err){
        if(err && err.err) console.error("err", err.err);
        clearErrorJob(err);
      }
      //console.log("cron end");
    }
  }
  
  function parseMessage(Body){
    try{
      return JSON.parse(Body);
    } catch(e){
      console.error("Error parseMessage", e);
    }
    return {}
  }

  async function makeParameter(getsqsmessage, jobId, workDir){
    return new Promise(async (resolve, reject)=>{
      try{
        status.addJob(jobId);
        const msg = await getsqsmessage();
        const {MessageId, ReceiptHandle, Body, MD5OfBody} = msg;
        const parsedMessage = parseMessage(Body)
        console.log("[GET_MESSAGE]", JSON.stringify(parsedMessage));
        return resolve({
          startAt: Date.now(),
          jobId,
          workDir,
          sqsmessage: parsedMessage
        })
      }catch(err){
        if(err) console.error("Error makeParameter", err);
        return reject({jobId, workDir, err})
      }
      
    });
    
  }
  
  async function downloadFile(data) {
    console.log("[DOWNLOAD_FILE]", JSON.stringify(data));
    const {workDir, jobId, sqsmessage} = data; 
    const {source} = sqsmessage;
    
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
        console.log("[CONVERT_PDF_BASE64]", JSON.stringify(data));
        
        let outputPath = `${workDir}/temp.pdf`;
        
        if(extname && extname.toLowerCase() === ".pdf" ){
          outputPath = downloadPath;
          const response = Object.assign({
              success: true,
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
    console.log("[UPLOAD_PDF]", JSON.stringify(data));
    
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
    
    //upload base64 pdf
    const {workDir, jobId, outputPath, sqsmessage, success} = data
    const {target} = sqsmessage;
    return new Promise(async (resolve, reject)=>{
      try{
        if(success === true){
          console.log("[UPLOAD_PDF]", JSON.stringify(data));
          const targetBase64Key = target.key.substring(0, target.key.lastIndexOf("."));
          const r = await filewrapper.uploadToS3(outputPath, target.bucket, targetBase64Key, true);
        } else {
          console.log("[UPLOAD_PDF_FALSE]", JSON.stringify(data));
          const falseKey = target.key.substring(0, target.key.lastIndexOf("/") + 1) + "false";
          console.log(falseKey);
          const r = await filewrapper.uploadToS3(outputPath, target.bucket, falseKey);
        }
        
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
      console.log(`[COMPLETE] ${jobId} ${workingDuration}ms`);
    })

  }


  async function clearErrorJob(data){
    
    const {jobId, workDir, err} = data
    clearJob(data);
    if(err) console.error("[ERROR_JOB]", err);
  }

  async function clearJob(data){
    
    const {jobId, workDir} = data
    //if(jobId && workDir) console.log("[CLEAR_JOB]", JSON.stringify(data));
    if(jobId) status.removeJob(jobId);
    if(workDir) filewrapper.deleteDir(workDir);
    
  }