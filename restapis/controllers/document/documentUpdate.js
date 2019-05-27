'use strict';
const documentService = require('./documentMongoDB');
const {utils} = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  const {principalId, body} = event;
  const {documentId, desc, title, tags, useTracking, forceTracking, isDownload} = body;

  console.log(body);

  if(!documentId && !desc && !title && !tags && !useTracking && !forceTracking){
    throw new Error("parameter is invalid!!");
  }

  const document = await documentService.getDocumentById(documentId);

  if(!document){
    throw new Error(`document does not exists ${documentId}`);
  }

  if(!principalId || document.accountId !== principalId){
    throw new Error("no permission");
  }

  const newDoc = {_id: document._id};
  if(desc){
    newDoc.desc = desc;
  }
  
  if(title) {
    newDoc.title = title;
    let newSeoTitle;
    let existsSeoTitle;
    do {
      newSeoTitle = utils.toSeoFriendly(title);
      existsSeoTitle = await documentService.getFriendlyUrl(newSeoTitle);
    } while(existsSeoTitle)

    newDoc.seoTitle = newSeoTitle;
  }

  if(tags && tags.length>0){
    newDoc.tags = tags;
  }

  if(useTracking === true || useTracking === 'true'){
    newDoc.useTracking = true;
  } else {
    newDoc.useTracking = false;
  }

  if(forceTracking === true || forceTracking === 'true'){
    newDoc.forceTracking = true;
  } else {
    newDoc.forceTracking = false;
  }

  if(isDownload === true || isDownload === 'true'){
    newDoc.isDownload = true;
  } else {
    newDoc.isDownload = false;
  }

  document.updated = Date.now();
  const result = await documentService.updateDocument(newDoc);
  console.log("update document", result);

  const response =  JSON.stringify({
    success: true,
    result: result
  });

  return callback(null, response);
};
