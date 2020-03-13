'use strict';
const documentService = require('./documentMongoDB');
const {s3, utils} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');
const helpers = require('../eventHelpers');
//const s3 = require('./documentS3');
const DOWNLOAD_SIZE_LIMIT = 30 * Math.pow(2, 20);
const cookieUtil = require('cookie');

module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  try{
 
    const eventParams = utils.parseLambdaEvent(event)
    const { documentId } = eventParams.params;
    const cookies = eventParams.cookies    
    const origin = eventParams.headers?eventParams.headers.origin:null

    if(!documentId ) {
      return callback(new Error("parameter is invalid!!!"));
    }

    const document = await documentService.getDocumentById(documentId);
    //console.log("document", document);

    if(!document){
      return callback(new Error("document does not exists!!!"));
    }
    console.log("document.isDownload", document.isDownload);
    if(document.isDownload === undefined || document.isDocument === false){
      console.log("Unable to download");
      return utils.makeResponse(JSON.stringify({
        success: false,
        message: "Unable to download"
      }));
    }

    const documentName = document.documentName;
    const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
    //const signedUrl = s3.generateSignedUrl(document.accountId, document.documentId, ext);
    const documentKey = `FILE/${document.accountId}/${document.documentId}.${ext}`;
    const signedUrl = await s3.signedDownloadUrl2({region: region, bucket: s3Config.document, key: documentKey, signedUrlExpireSeconds: 60});

    const trackingIds = utils.generateTrackingIds(cookies);

    await helpers.saveEvent(Object.assign(makeDownloadEventParamsLambdaProxy(eventParams, event), {trackingIds}), documentService.WRAPPER)

    return utils.makeResponse(JSON.stringify({
      success: true,
      downloadUrl: signedUrl,
      document: document
    }), utils.makeTrackingCookie(trackingIds, origin));

  } catch (err) {
    console.error(err);
    return utils.makeErrorResponse(err);
  }
  
};


function makeDownloadEventParamsLambdaProxy(eventParams, event){

  const {path, method, cookies, headers} = eventParams;
  
  return {
    type: "DOWNLOAD",
    path: path,
    method: method,
    headers: headers,
    payload: eventParams.params,
    eventSrc: event
  }
}



