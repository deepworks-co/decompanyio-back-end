'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const documentS3 = require('./documentS3');
const {utils, s3} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');

module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  const {principalId, path} = event;
  console.log("event : ", event);
  try{
    
    let documentId = decodeURI(path.documentId);
    
    if(!documentId){
      throw new Error("parameter is invaild!!");
    }

    let document = await documentService.getDocumentBySeoTitle(documentId);
    console.log("get document by seo title", document);
    if(!document || document.isDeleted === true){
      return JSON.stringify({
        success: true,
        message: "document does not exist!",
      });
    }

    console.log("documentId", document._id);
    const results = await Promise.all([
      documentS3.getDocumentTextById(document._id),
      documentService.getRecentlyPageViewTotalCount(),
      documentService.getFeaturedDocuments({documentId: document.documentId})
    ]);

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

function checkPermission(document, principalId){
  const {isPublic, isBlocked} = document;

  if(isPublic === undefined || isBlocked === undefined){
    throw new Error('Error document object is not valid');
  }

  if(isBlocked === true){
    return false;
  }

  if(isPublic === true) {
    return true;
  }

  if(principalId && principalId === document.accountId){
    return true;
  }

  return false;  
}