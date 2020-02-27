'use strict';
const documentService = require('./documentMongoDB');
const {s3, utils} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');
const helpers = require('../eventHelpers');
//const s3 = require('./documentS3');

const DOWNLOAD_SIZE_LIMIT = 30 * Math.pow(2, 20);


module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {documentId} = event.queryStringParameters?event.queryStringParameters:{};

  if(!documentId ) {
    return callback(new Error("parameter is invalid!!!"));
  }

  const document = await documentService.getDocumentById(documentId);
  //console.log("document", document);

  if(!document){
    return callback(new Error("document does not exist!!!"));
  }
  console.log("document.isDownload", document.isDownload);
  if(document.isDownload === undefined || document.isDocument === false){
    console.log("Unable to download");
    return utils.makeResponse(JSON.stringify({
      success: false,
      message: "Unable to download"
    }));
  }

  if(document.documentSize > DOWNLOAD_SIZE_LIMIT){
    console.log("file size exceed : 30M", document.documentSize/Math.pow(2, 20));
    return utils.makeResponse(JSON.stringify({
      success: false,
      message: "file size exceed"
    }));
  }

  const documentName = document.documentName;
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  //const signedUrl = s3.generateSignedUrl(document.accountId, document.documentId, ext);
  const documentKey = `FILE/${document.accountId}/${document.documentId}.${ext}`;
  const signedUrl = await s3.signedDownloadUrl2({region: region, bucket: s3Config.document, key: documentKey, signedUrlExpireSeconds: 60});

  await helpers.saveEvent(makeDownloadEventParamsLambdaProxy(event), documentService.WRAPPER)

  return utils.makeResponse(JSON.stringify({
    success: true,
    downloadUrl: signedUrl,
    document: document
  }));
};

function makeDownloadEventParamsLambdaProxy(lambdaEvent){

  const {path, httpMethod, requestContext, headers, query, body} = lambdaEvent;
  
  const userAgent = requestContext && requestContext.identity?requestContext.identity.userAgent:undefined
  const sourceIp = requestContext && requestContext.identity?requestContext.identity.sourceIp:undefined
  const payload = httpMethod==="GET"?query:body;
  const cookie = headers?headers.cookie:undefined;

  return {
    type: "download",
    path: path,
    method: httpMethod,
    header: {
        userAgent: userAgent,
        sourceIp: sourceIp,
        cookie: cookie
    },
    payload: payload 
  }
}

