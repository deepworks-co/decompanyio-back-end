'use strict';
const documentService = require('./documentMongoDB');
const s3 = require('./documentS3');

module.exports.handler = async (event, context, callback) => {
  console.log(event);
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {query} = event;
  const {documentId} = query;

  if(!documentId ) {
    throw new Error("parameter is invalid!!!");
  }

  const document = await documentService.getDocumentById(documentId);
  console.log("document", document);

  if(!document){
    throw new Error("document does not exist!!!");
  }
  console.log("document.isDownload", document.isDownload);
  if(document.isDownload === undefined || document.isDocument === false){
    console.log("Unable to download");
    return JSON.stringify({
      success: false,
      message: "Unable to download"
    });
  }

  const documentName = document.documentName;
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  const signedUrl = s3.generateSignedUrl(document.accountId, document.documentId, ext);
  
  return JSON.stringify({
    success: true,
    downloadUrl: signedUrl,
    document: document
  });
};
