'use strict';
const documentService = require('../document/documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  const {principalId, query} = event;
  
  if(!query.documentId){
    callback ("parameter is null");
  }

  const documentId = query.documentId;
  const resultList = await documentService.getTrackingList(documentId);
  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return (null, response);
};
