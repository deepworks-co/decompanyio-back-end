'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const documentS3 = require('./documentS3');
const {utils, s3} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');


var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}
module.exports.list = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event", JSON.stringify(event));

  const params = event.method === "POST"?event.body:event.query;

  console.log("parameters", params);
  
  const pageNo = isNaN(params.pageNo)?1:Number(params.pageNo);
  const pageSize = isNaN(params.pageSize)?10:Number(params.pageSize);
  let accountId = params.accountId?decodeURI(params.accountId):null;
  const email = params.email?decodeURI(params.email):null;
  const username = params.username?decodeURI(params.username):null;
  const tag = params.tag;
  const path = params.path;
  const skip = ((pageNo - 1) * pageSize);

  const totalViewCountInfo = await documentService.getRecentlyPageViewTotalCount();

  if(!accountId && email){
    const user = await documentService.getUser({email:email});
    console.log("by email", user);
    accountId = user._id;
  } else if(!accountId && username) {
    const user = await documentService.getUser({username:username});
    console.log("by username", user);
    accountId = user._id;
  }

  const resultList = await documentService.queryDocumentList({
    pageNo: pageNo,
    accountId: accountId,
    tag: tag,
    path: path,
    pageSize: pageSize,
    skip: skip
  });
  
  return (null, JSON.stringify({
    success: true,
    resultList: resultList,
    pageNo: pageNo,
    count: resultList.length,
    totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
  }));


};


module.exports.info = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event : ", event.path);
  try{
    //console.log("context : ", context);
    let documentId = event.path.documentId;

    if(!documentId){
      throw new Error("parameter is invaild!!");
    }

    let document = await documentService.getDocumentBySeoTitle(documentId);
    console.log("get document by seo title", document);
    if(!document){
      return JSON.stringify({
        success: true,
        message: "document does not exist!",
      });
    }
    const promises = []
      
    //const textList = await s3.getDocumentTextById(document._id);
    console.log("documentId", document._id);
    promises.push(documentS3.getDocumentTextById(document._id));

    //console.log(textList);

    promises.push(documentService.getRecentlyPageViewTotalCount());
    
    //const featuredList = await documentService.getFeaturedDocuments({documentId: document.documentId});
    promises.push(documentService.getFeaturedDocuments({documentId: document.documentId}));

    const results = await Promise.all(promises);

    const textList = results[0];
    const totalViewCountInfo = results[1];
    const featuredList = results[2];
    

    const response = JSON.stringify({
        success: true,
        document: document,
        text: textList,
        featuredList: featuredList,
        totalViewCountInfo: totalViewCountInfo
      }
    );

    return (null, response);
  } catch(e) {
    console.error(e);
    throw e
  }
  
}
/*
module.exports.downloadFile = async (event, context, callback) => {

  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {query} = event;
  const {documentId} = query;

  if(!documentId ) {
    throw new Error("parameter is invalid!!!");
  }

  const document = await documentService.getDocumentById(documentId);
  console.log("document", document);

  if(!document){
    throw new Error("document does not exist!!!");
  }

  if(document.isDownload || document.isDownload === false){
    return JSON.stringify({
      success: false,
      message: "Unable to download"
    });
  }

  const documentName = document.documentName;
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  const signedUrl = documentS3.generateSignedUrl(document.accountId, document.documentId, ext);
  
  return JSON.stringify({
    success: true,
    downloadUrl: signedUrl,
    document: document
  });

}
*/
