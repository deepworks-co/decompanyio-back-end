'use strict';
const documentService = require('../document/documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  const {principalId, query} = event;

  console.log("principalId", principalId);

  if(!principalId){
    throw new Error("Unauthorized");
  }
  
  if(!query.documentId){
    throw new Error("parameter is invalid");
  }

  const documentId = query.documentId;
  const resultList = await documentService.getTrackingList(documentId);
  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return (null, response);
};
