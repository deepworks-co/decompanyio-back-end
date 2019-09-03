'use strict';
const documentService = require('../document/documentMongoDB');


module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {principalId, query} = event;
  const {documentId, anonymous, include} = query;
  console.log("query", query);

  if(!documentId){
    throw new Error("parameter is invalid");
  }
  const resultList = await documentService.getTrackingList(documentId, anonymous?JSON.parse(anonymous):false, include?JSON.parse(include):false);
  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return (null, response);
};
