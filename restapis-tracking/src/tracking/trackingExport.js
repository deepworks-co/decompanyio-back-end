'use strict';
const documentService = require('../document/documentMongoDB');
const converter = require('json-2-csv');
const {utils, s3} = require('decompany-common-utils');
const { s3Config, region } = require('decompany-app-properties');

module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
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
  
  const downloadName = "tracking/" + documentId + "_" + timestamp + ".csv";
  const bucket = s3Config.document;
  
  const keys = ['user.e','count', 'viewTimestamp', 'totalReadTimestamp'];
  const csvString = await json2csv(resultList, keys);
  
  const t =  timestamp - (timestamp % (1000 * 60 * 60 * 24));
  const csvKey = `temp/csv/tracking/T${t}/${documentId}/${downloadName}`;
  const expried = new Date(timestamp + 1000 * 60); //1min
  console.log(bucket, csvKey);
  const r = await s3.putObjectAndExpries(bucket, csvKey, csvString, "text/csv", region, expried);
  console.log("putObjectAndExpries", r);
  const csvDownloadUrl = await s3.signedDownloadUrl2({region: region, bucket: bucket, key: csvKey, signedUrlExpireSeconds: 60});
   

  const response = JSON.stringify({
    success: true,
    downloadUrl: csvDownloadUrl
  })

  return callback(null, response);
};

async function json2csv(jsonList, keys){
  return new Promise((resolve, reject)=>{
    
    converter.json2csv(jsonList, (err, csv)=>{    
      if(err) reject(err);
      else resolve(csv);
    }, {
      keys: keys
    });

  });
}