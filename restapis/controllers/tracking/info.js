'use strict';
const documentService = require('../document/documentMongoDB');

module.exports.handler = async (event, context, callback) => {
  const {principalId, query} = event;

  if(!query || !query.documentId || !query.cid){
    throw new Error("parameter is invalid");
  }  
  const {documentId, cid} = query;
    
  const doc = await documentService.getDocumentById(documentId);
  if(!doc){
    throw new Error("document is invalid! " + documentId);
  }
  if(principalId !== doc.accountId){
    throw new Error("Unauthorized");
  }

  const resultList = await documentService.getTrackingInfo(documentId, cid);
  //console.log("query result", resultList);
  //const r = resultList[0]?resultList[0].resultList:resultList;

  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return (null, response);

  
};
