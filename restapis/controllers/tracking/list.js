'use strict';
const documentService = require('../documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  const body = event.queryStringParameters?event.queryStringParameters:{};
  console.log("parameter", body);
  if(!body.documentId){
    callback ("parameter is null");
  }

  const documentId = body.documentId;
  const resultList = await documentService.getTrackingList(documentId);
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      resultList: resultList
    })
  };

  return (null, response);
};
