'use strict';
const documentService = require('../documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  const body = event.queryStringParameters?event.queryStringParameters:{};
  console.log("parameter", body);
  if(!body.documentId){
    callback ("parameter is null");
  }
  const resultList = await documentService.getTrackingInfo(body.documentId);
  console.log(resultList);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      resultList: resultList
    })
  };

  return (null, response);
};
