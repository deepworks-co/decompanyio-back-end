'use strict';
const documentService = require('../document/documentMongoDB');
const converter = require('json-2-csv');
const {utils, s3} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

module.exports.handler = async (event, context, callback) => {
  console.log(event);
  try{
    const {query, requestId} = event;
    const {userid, documentId, week, csv} = query;


    if(!userid && !documentId){
      throw new Error("parameters are invaild!!'");
    }

    const w = week?Number(week):1;
    const isWeekly = w>4?true:false;
    const now = new Date();
    let startDate = new Date(utils.getBlockchainTimestamp(new Date(now - 1000 * 60 * 60 * 24 * 7 * w))); //w주 전
    let endDate = new Date();
   
    console.log("start~end", startDate, endDate);
    let resultList;
    if(userid){
      //4주 이상이면 Week를 기준으로 집계한다.
      resultList = await documentService.getAnalyticsListByUserId(userid, startDate, endDate, isWeekly);
    
    } else {
      if(isWeekly){
        resultList = await documentService.getAnalyticsListWeekly([documentId], startDate, endDate);
      } else {
        resultList = await documentService.getAnalyticsListDaily([documentId], startDate, endDate);
      }
      //resultList = await documentService.getAnalyticsListDaily([documentId], startDate, endDate);
    }
    console.log(resultList);
    let csvDownloadUrl;
    if(csv){
      const downloadName = documentId + "_" + Date.now();
      const csvString = await json2csv(resultList);
      const csvKey = "temp/csv/analytics_" + downloadName + ".csv";
      const bucket = "dev-ca-document";
      const region = "us-west-1";
      const expried = new Date(now + 1000 * 60); //1min
      const r = await s3.putObject(bucket, csvKey, csvString, "text/csv", region, expried);
      console.log(r);
      csvDownloadUrl = await s3.signedDownloadUrl(region, bucket, csvKey, 60);

    }
  
    const response = JSON.stringify({
      success: true,
      resultList: resultList?resultList:[],
      csvDownloadUrl: csvDownloadUrl,
      isWeekly: isWeekly
    });

    return (null, response);
  } catch(e){
    console.error(e);
    const {message, stack, lineNumber, fileName, number} = e;
    throw new Error(message);
  }
  
};


async function json2csv(jsonList){
  return new Promise((resolve, reject)=>{
    
    converter.json2csv(jsonList, (err, csv)=>{    
      if(err) reject(err);
      else resolve(csv);
    });

  });
}