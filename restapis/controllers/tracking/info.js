'use strict';
const documentService = require('../document/documentMongoDB');
const {utils} = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  const {principalId, query} = event;

  if(!query || !query.documentId || !query.cid){
    throw new Error("parameter is invalid");
  }  
  console.log("query", query);
  let {documentId, cid, include} = query;
 
  if(include){
    include = JSON.parse(include);
  } else {
    include = false;
  }
  
  console.log("parameter", {documentId, cid, include})

  const doc = await documentService.getDocumentById(documentId);
  
  if(!doc){
    throw new Error("document is invalid! " + documentId);
  }

  if(!utils.isLocal() && principalId !== doc.accountId){
    throw new Error("Unauthorized");
  }

  const resultList = await documentService.getTrackingInfo(documentId, cid, null, include);
  //console.log("query result", resultList);
  //const r = resultList[0]?resultList[0].resultList:resultList;

  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return (null, response);

  
};
