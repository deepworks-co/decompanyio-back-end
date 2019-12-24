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
  task = cron.schedule(expression, async ()=>{
    await cronJob();
  });
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

      params = await makeParameter(GetMessage, params)
      if(params){
        console.log("get parameter", JSON.stringify(params));

        const downloadResult = await downloadFile(params);
        console.log("download file", downloadResult);

        const inputParams = {
          workDir,
          jobId,
          target: params.target,
          documentId: params.documentId,
          userId: params.userId,
          downloadPath: downloadResult.downloadPath,
          extname: downloadResult.extname
        }

        const convertResult = await convert(inputParams);
        console.log("convert complete", convertResult);
        inputParams.pdfPath = convertResult.pdfPath;
        inputParams.textPath = convertResult.textPath;
        inputParams.imagePaths = convertResult.imagePaths;
        const totalPages = convertResult.imagePaths.length;

        const uploadTextJsonResult = await uploadTextJson(inputParams);
        console.log("uploadTextJson", uploadTextJsonResult)
        
        /**
         * 주의 이미지가 업로드 되면 lambda에 의해 resize가 발생함(비용발생)
         * 테스트시 유의할것
         */
        const uploadThumbnailResult = await uploadThumbnails(inputParams);
        console.log("uploadThumbnails", uploadThumbnailResult)
    
        const uploadPdfResult = await uploadPdfBase64(inputParams);
        console.log("uploadPdfBase64", uploadPdfResult);

        response = Object.assign({totalPages: totalPages}, inputParams);
        
        const uploadCompleteResult = await uploadCompleteJson({
          json: JSON.stringify(response),
          documentId: inputParams.documentId,
          target: inputParams.target
        })

        const workingDuration = startAt?(Date.now() - startAt): -1;
        console.log(`[COMPLETE] ${jobId} ${workingDuration}ms`);
      } //if(params)
    } 
  } catch(err){
    console.error("error", err);
    response = Object.assign(response, {error: {message: err.message, stack: err.stack}});
    await clearErrorJob({jobId, workDir, err})
  } finally{
    await completeJob({startAt, jobId, workDir});
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

function makeParameter(getsqsmessageFunc, {jobId, workDir, startAt}){
 
  return new Promise(async (resolve, reject)=>{
    try{
      status.addJob(jobId);
      const body = await getsqsmessageFunc();

      if(body){
        const parsedMessage = parseMessage(body)
        const userId = parsedMessage.source.key.split("/")[1];
        const filename = parsedMessage.source.key.split("/")[2];
        const documentId = filename.substring(0, filename.lastIndexOf("."));
        resolve({
          startAt,
          jobId,
          workDir,
          sqsmessage: parsedMessage, 
          documentId: documentId,
          userId: userId,
          target: parsedMessage.target
        })
      } else {
        resolve(undefined)
      }
      
    }catch(err){
      if(err) console.error("Error makeParameter", err);
      reject(err);
    }
    
  });
  
}

/**
 * 
 * @param {*} param0 
 */
function downloadFile({workDir, jobId, sqsmessage}) {
  const {source} = sqsmessage;
  
  return new Promise(async (resolve, reject)=>{
    try{
      const result = await filewrapper.dowloadFromS3(workDir, source.bucket, source.key)

      resolve({  
        downloadPath: result.downloadPath,
        extname: result.extname,
        filename: result.filename,
      })
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

/**
 * 
 * @param {*} param0 
 */
function completeJob({jobId, workDir} ){
  return new Promise((resolve, reject)=>{
    clearJob({jobId, workDir});
    resolve(true);
  })

}

/**
 * 
 * @param {*} param0 
 */
async function clearErrorJob({jobId, workDir, err}){
  
  clearJob({jobId, workDir});
  if(err) console.error("[ERROR_JOB]", err);
}

function clearJob({jobId, workDir}){
  
  if(jobId) status.removeJob(jobId);
  if(workDir) filewrapper.deleteDir(workDir);
  
}