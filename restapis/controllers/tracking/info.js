'use strict';
const documentService = require('../documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  const body = event.queryStringParameters?event.queryStringParameters:{};
  //console.log("parameter", body);
  if(!body.documentId || !body.cid){
    throw new Error("parameter is invalid");
  }

  try{
    const documentId = body.documentId;
    const cid = body.cid;
    const resultList = await documentService.getTrackingInfo(documentId, cid);
    //console.log("query result", resultList);
    //const r = resultList[0]?resultList[0].resultList:resultList;

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
  } catch(e){
    return (e, e.message);
  }
  
};
