'use strict';
const pdfconverter = require('./pdf-converter-wrapper');
const textconverter = require('./text-converter-wrapper');
const imageconverter = require('./image-converter-wrapper');
const getsqsmessageWrapper = require('./get-convert-message');
const filewrapper = require('./file-wrapper');
const cron = require('node-cron');
const Status = require('./status');
const status = new Status();
const R = require('ramda');
let task;
const expression = process.env.EXPRESSION?process.env.EXPRESSION:'*/1 * * * * *'
const WORK_DIR_PREFIX = process.env.WORK_DIR_PREFIX?process.env.WORK_DIR_PREFIX:'/cronwork'

module.exports.init = () => {
  console.log("cron start", expression)
  task = cron.schedule(expression, cronJob);
  return this;    
}

module.exports.test = async (args) => {
  console.log("cron test start", args.constructor === Array);

  if(args.constructor === Array){
    const results = [];
    for(let i=0;i<args.length;i++){
      results[i]= await cronJob(args[i]);
    }

    return results;
  } else if(args.constructor === Object){
    return await cronJob(args);
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
  let response = {};
  const startAt = Date.now();
  const jobId = `job_${startAt}`;
  const workDir = `${WORK_DIR_PREFIX}/${jobId}`;
  let params = {
    startAt,
    jobId,
    workDir
  }

  const GetMessage = args?()=>Promise.resolve(args):getsqsmessageWrapper;

  try{
    if(status.isStop() === true && status.jobCount() === 0) {
      console.log("stopping pdf converter");
      return {stopping: true, message: "stopping pdf converter"}
    } else if(status.jobCount() < 1 && status.isStop() === false){

      params = await makeParameter(GetMessage, params);
      console.log("make parameter", JSON.stringify(params));

      const result1 = await downloadFile(params);
      console.log("download file", result1);

      const inputParams = {
        workDir,
        jobId,
        target: params.target,
        documentId: params.documentId,
        userId: params.userId,
        downloadPath: result1.downloadPath,
        extname: result1.extname
      }

      const result2 = await convert(inputParams);
      console.log("convert complete", result2);
      inputParams.pdfPath = result2.pdfPath;
      inputParams.textPath = result2.textPath;
      inputParams.imagePaths = result2.imagePaths;
      const totalPages = result2.imagePaths.length;
      const result3 = await uploadTextJson(inputParams);
      console.log("uploadTextJson", result3)
      
      /**
       * 주의 이미지가 업로드 되면 lambda에 의해 resize가 발생함(비용발생)
       * 테스트시 유의할것
       */
      const result4 = await uploadThumbnails(inputParams);
      console.log("uploadThumbnails", result4)
   
      const result5 = await uploadPdfBase64(inputParams);
      console.log("uploadPdfBase64", result5);

      response = Object.assign({totalPages: totalPages}, inputParams);
      
      const result6 = await uploadCompleteJson({
        json: JSON.stringify(response),
        documentId: inputParams.documentId,
        target: inputParams.target
      })

      console.log("uploadCompleteJson", result6);

    } else {
      return Promise.reject(new Error("Error 동시에 변환 프로세스가 동작할수 없습니다."));
    }
  } catch(err){
    response = Object.assign(response, {error: {message: err.message, stack: err.stack}});
    await clearErrorJob({jobId, workDir, err})
  } finally{
    await completeJob(params);
  }  
  return Promise.resolve(response)
}
    
  
function parseMessage(Body){
  try{
    return JSON.parse(Body);
  } catch(e){
    console.error("Error parseMessage", e);
  }
  return {}
}

async function makeParameter(getsqsmessageFunc, {jobId, workDir, startAt}){
  return new Promise(async (resolve, reject)=>{
    try{
      status.addJob(jobId);
      const msg = await getsqsmessageFunc();
      const {MessageId, ReceiptHandle, Body, MD5OfBody} = msg;
      const parsedMessage = parseMessage(Body)
      const userId = parsedMessage.source.key.split("/")[1];
      const filename = parsedMessage.source.key.split("/")[2];
      const documentId = filename.substring(0, filename.lastIndexOf("."));
      return resolve({
        startAt,
        jobId,
        workDir,
        sqsmessage: parsedMessage, 
        documentId: documentId,
        userId: userId,
        target: parsedMessage.target
      })
    }catch(err){
      if(err) console.error("Error makeParameter", err);
      return reject({jobId, workDir, err})
    }
    
  });
  
}

async function downloadFile(data) {

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

/**
 * @param downloadPath
 * @param extname
 * @param workDir
 * @param jobId
 */

async function convert({downloadPath, extname, workDir, jobId}){

  return new Promise(async (resolve, reject)=>{
    try{ 
      let response = {}
      const params = {w: "1280", h: "1280", downloadPath, extname, workDir, jobId};
      if(extname && extname.toLowerCase() === ".pdf" ){
        response.pdfPath = downloadPath;
      } else {
        const outputPath = `${workDir}/temp.pdf`;
        params.outputPath = outputPath;
        const r = await pdfconverter(params);
        console.log("pdfconverting complete", r);
        response.pdfPath = r.outputPath;
      }
      
      response.textPath = await textconverter(params);

      response.imagePaths = await imageconverter(params);

      resolve(response);
      
    } catch(err){
      console.error("Error convertPdf", err);
      reject({err, jobId, workDir});
    }
  });
  
  
}

async function uploadPdf({workDir, jobId, outputPath, targetBucket, targetKey}){
  //upload pdf
  return new Promise(async (resolve, reject)=>{
    try{
      const r = await filewrapper.uploadToS3(outputPath, targetBucket, targetKey)
      resolve(r);
    } catch(err){
      console.log(err);
      reject({workDir, jobId, err});
    }
    
  })
  
}

/**
 * 
 * @param {*} param0 
 */
async function uploadPdfBase64({workDir, jobId, documentId, pdfPath, target}){

  return new Promise(async (resolve, reject)=>{
    try{
      const targetKey = `PDF/${documentId}/${documentId}`
      const r = await filewrapper.uploadToS3(pdfPath, target.bucket, targetKey, true);
      resolve(r);
    }catch(err){
      reject({jobId, workDir, err});
    }
  })
  
  
}

/**
 * 
 * @param {*} param0 
 */
function uploadTextJson({documentId, target, textPath}){
  
  return new Promise((resolve, reject)=>{
    const targetKey = `THUMBNAIL/${documentId}/text.json`;
    filewrapper.uploadToS3(textPath, target.bucket, targetKey)
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    });

  })
}

/**
 * 
 * @param {*} param0 
 */
function uploadThumbnails({documentId, target, imagePaths}){

  return new Promise((resolve, reject)=>{
    if(!documentId){
      return reject(new Error("document id is undefined"));
    }
    if(!imagePaths){
      return reject(new Error("imagePaths are undefined"));
    }

    Promise.all(imagePaths.map((file)=>{
      
      const splits = file.split("/");
      const key = `THUMBNAIL/${documentId}/1200X1200/${splits[splits.length - 1]}`;

      return filewrapper.uploadToS3(file, target.bucket, key)
      
    })).then((results)=>{
      resolve(results);
    }).catch((errs)=>{
      reject(errs);
    })

  })
}

/**
 * 
 * @param {*} param0 
 */
function uploadCompleteJson({json, target, documentId}){
  return new Promise((resolve, reject)=>{
    const key = `THUMBNAIL/${documentId}/result.json`;
    filewrapper.uploadJsonToS3(json, target.bucket, key)
    .then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })

  })
}

function completeJob(data){
  const {startAt, jobId, workDir} = data
  return new Promise((resolve, reject)=>{
    clearJob(data);
    
    const workingDuration = startAt?(Date.now() - startAt): -1;
    console.log(`[COMPLETE] ${jobId} ${workingDuration}ms`);
    resolve(true);
  })

}


async function clearErrorJob(data){
  
  const {jobId, workDir, err} = data
  clearJob(data);
  if(err) console.error("[ERROR_JOB]", err);
}

function clearJob(data){
  
  const {jobId, workDir} = data
  if(jobId) status.removeJob(jobId);
  if(workDir) filewrapper.deleteDir(workDir);
  
}