'use strict';
const documentService = require('../document/documentMongoDB');
const converter = require('json-2-csv');
const {utils, s3} = require('decompany-common-utils');


module.exports.handler = async (event, context, callback) => {

  const {query, principalId} = event;
  const {documentId, week, year} = query;
  console.log("query", query);

  const isWeekly = week && !year?true:false;

  const w = week?Number(week):-1;
  const y = year?Number(year):-1;

  if(w<0 && y<0){
    throw new Error(`parameter is invalid! w : ${w}, y : ${y}`);
  }

  const now = new Date();
  let startDate = new Date(utils.getBlockchainTimestamp(new Date(now - 1000 * 60 * 60 * 24 * 7 * w))); //w주 전
  let endDate = new Date();
  if(!isWeekly){
    //monthly 1년 단위 검색
    startDate = new Date(Date.UTC(endDate.getUTCFullYear()-1, endDate.getUTCMonth()-1, 1));
    console.log("1 year ago", startDate);
  }
  
  
  console.log("search period start~end", startDate, endDate, isWeekly?"Weekly":"Monthly", isWeekly?w:y*12);
  
  let documentIds = [];
  if(!documentId){
    documentIds = await documentService.getDocumentIdsByUserId(principalId);
    
  } else {
    const doc = await documentService.getDocumentById(documentId);
    if(!doc){
      throw new Error("document is invalid! " + documentId);
    }
    if(!utils.isLocal() && principalId !== doc.accountId){
      throw new Error("Unauthorized");
    }
    documentIds.push(documentId);
  }
  console.log("documentIds", documentIds, startDate, endDate);
  let resultList;
  if(isWeekly){

    if(w>4){
      resultList = await documentService.getAnalyticsListWeekly(documentIds, startDate, endDate);
    } else {
      resultList = await documentService.getAnalyticsListDaily(documentIds, startDate, endDate);
    }
  } else {
    resultList = await documentService.getAnalyticsListMonthly(documentIds, startDate, endDate);
  }   
  console.log("resultList", resultList);
  const response = JSON.stringify({
    success: true,
    resultList: resultList?resultList:[]
  });

  return (null, response);
};
