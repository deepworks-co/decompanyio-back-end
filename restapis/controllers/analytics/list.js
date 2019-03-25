'use strict';
const documentService = require('../document/documentMongoDB');
const converter = require('json-2-csv');
const {utils, s3} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

module.exports.handler = async (event, context, callback) => {
  //console.log(event);
  try{
    console.log("queryStringParameters", event.queryStringParameters)
    const body = event.queryStringParameters?event.queryStringParameters:{};
    const {userid, documentId, week, csv} = body;

    if(!userid && !documentId){
      throw new Error("parameters are invaild!!'");
    }

    const w = week?Number(week):1;
    const isWeekly = w>4?true:false;
    const now = new Date();
    let startDate = new Date(utils.getBlockchainTimestamp(new Date(now - 1000 * 60 * 60 * 24 * 7 * w))); //4주전
    let endDate = new Date();
   
    console.log("start~end", startDate, endDate);
    let resultList;
    if(userid){
      //4주 이상이면 Week를 기준으로 집계한다.
      resultList = await documentService.getAnalyticsListByUserId(userid, startDate, endDate, isWeekly);
    
    } else {
      
      resultList = await documentService.getAnalyticsListDaily([documentId], startDate, endDate);
    }
    console.log(resultList);
    let csvDownloadUrl;
    if(csv){
      const csvString = await json2csv(resultList);
      const csvKey = "temp/csv/analytics_" + event.requestContext.requestId + ".csv";
      const bucket = "dev-ca-document";
      const region = "us-west-1";
      const expried = new Date(now + 1000 * 60); //1min
      const r = await s3.putObject(bucket, csvKey, csvString, "text/csv", region, expried);
      console.log(r);
      csvDownloadUrl = await s3.signedDownloadUrl(region, bucket, csvKey, 60);

    }
  
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        resultList: resultList?resultList:[],
        csvDownloadUrl: csvDownloadUrl,
        isWeekly: isWeekly
      })
    };

    return (null, response);
  } catch(e){
    console.error(e);
    const {message, stack, lineNumber, fileName, number} = e;

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        error: message
      })
    };

    return (stack, response);
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