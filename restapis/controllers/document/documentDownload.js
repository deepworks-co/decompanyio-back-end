'use strict';
const documentService = require('./documentMongoDB');
const {s3, utils} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');
const helpers = require('../eventHelpers');
//const s3 = require('./documentS3');
const cookieUtil = require('cookie');
const DOWNLOAD_SIZE_LIMIT = 30 * Math.pow(2, 20);


module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  try{
    //const {documentId} = event.queryStringParameters?event.queryStringParameters:{};
    const eventParams = utils.parseLambdaEvent(event)
    const { documentId } = eventParams.params;

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

    const newHeader = makeHeader(event);

    return utils.makeResponse(JSON.stringify({
      success: true,
      downloadUrl: signedUrl,
      document: document
    }), newHeader);
  } catch (err) {
    console.error(err);
    return utils.makeErrorResponse(err);
  }
  
};

function makeHeader(eventParams){
  const expiredAt = new Date();
  const timestamp = expiredAt.getTime();
  const secend = 1 * 24 * 60 * 60; // cookie 만료 시간 1일 sec단위
  expiredAt.setTime(timestamp + (secend * 1000));

  const parsedCookie = cookieUtil.parse(eventParams.headers.cookie);
  console.log("parsedCookie", parsedCookie);
  let _dk = parsedCookie._dk;
  if(!_dk){
    const id = utils.randomId({
      alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-',
      size: 21
    });
    _dk = `${id}.${timestamp}`;//utils.stringToBase64(`${id}.${timestamp}`);
  }
  

  const origin = eventParams.headers.origin;
  const domain = origin?origin.replace(/(^\w+:|^)\/\//, ''):null;
    
  return {
    'Access-Control-Allow-Origin': origin,
    "Set-Cookie": `_dk=${_dk};expires=${expiredAt.toGMTString()};max-age=${secend};path=/;domain=${domain};Secure;HttpOnly;`,
  }
}
function makeDownloadEventParamsLambdaProxy(event){

  const {path, httpMethod, requestContext, queryStringParameters, body} = event;
  
  const userAgent = requestContext && requestContext.identity?requestContext.identity.userAgent:undefined
  const sourceIp = requestContext && requestContext.identity?requestContext.identity.sourceIp:undefined
 
  const cookie = cookieUtil.parse(event.headers.cookie);
  const payload = httpMethod==="GET"?queryStringParameters:body;

  return {
    type: "download",
    path: path,
    method: httpMethod,
    header: {
      userAgent: userAgent,
      sourceIp: sourceIp,
      cookie: cookie
    },
    payload: payload,
    event: event
  }
}



