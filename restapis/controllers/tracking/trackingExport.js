'use strict';
const documentService = require('../document/documentMongoDB');
const converter = require('json-2-csv');
const {utils, s3} = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {

  const {principalId, query} = event;
  
  console.log("query", query);
  if(!query.documentId){
    throw new Error("parameter is invaild");
  }
  const documentId = query.documentId;
  const doc = await documentService.getDocumentById(documentId);
  if(!doc){
    throw new Error("document is invalid! " + documentId);
  }
  if(principalId !== doc.accountId){
    throw new Error("Unauthorized");
  }

  const resultList = await documentService.getTrackingList(documentId);

  const timestamp = Date.now();
  const downloadName = "tracking_" + documentId + "_" + timestamp;
  const csvString = await json2csv(resultList);
  const csvKey = "temp/csv/tracking/" + downloadName + ".csv";
  const bucket = "dev-ca-document";
  const region = "us-west-1";
  const expried = new Date(timestamp + 1000 * 60); //1min
  const r = await s3.putObjectAndExpries(bucket, csvKey, csvString, "text/csv", region, expried);

  const csvDownloadUrl = await s3.signedDownloadUrl(region, bucket, csvKey, 60);

  const response = JSON.stringify({
    success: true,
    downloadUrl: csvDownloadUrl
  })

  return callback(null, response);
};

async function json2csv(jsonList){
  return new Promise((resolve, reject)=>{
    
    converter.json2csv(jsonList, (err, csv)=>{    
      if(err) reject(err);
      else resolve(csv);
    });

  });
}