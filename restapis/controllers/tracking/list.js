'use strict';
const documentService = require('../documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  const body = event.queryStringParameters?event.queryStringParameters:{};
  //console.log("parameter", body);
  if(!body.documentId){
    callback ("parameter is null");
  }
  try{
    const documentId = body.documentId;
    const cid = body.cid;
    const sid = body.sid;
    const resultList = await documentService.getTrackingList(documentId, cid, sid);
    console.log("query result", resultList);

    const r = resultList[0]?resultList[0].resultList:null;

    

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        resultList: r
      })
    };

    return (null, response);
  } catch(e){
    return (e, e.message);
  }
  
};
