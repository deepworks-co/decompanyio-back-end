'use strict';
const documentService = require('./documentMongoDB');
const {utils} = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {

  const {principalId, body} = event;
  const {documentId, desc, title, tags, useTracking} = body;

  if(!documentId && !desc && !title && !tags && !useTracking){
    throw new Error("parameter is invalid!!");
  }

  const document = await documentService.getDocumentById(documentId);

  if(!principalId || document.accountId !== principalId){
    throw new Error("no permission");
  }

  if(!document){
    throw new Error("document is not exists");
  } 

  if(desc){
    document.desc = desc;
  }
  
  if(title) {
    document.title = title;
    let newSeoTitle;
    let existsSeoTitle;
    do {
      newSeoTitle = utils.toSeoFriendly(title);
      existsSeoTitle = await documentService.getFriendlyUrl(newSeoTitle);
    } while(existsSeoTitle)

    document.seoTitle = newSeoTitle;
  }

  if(tags && tags.length>0){
    document.tags = tags;
  }

  if(useTracking){
    document.useTracking = useTracking;
  }
  document.updated = Date.now();
  const result = await documentService.saveDocument(document);
  console.log("save document", result);

  const response =  JSON.stringify({
    success: true,
    document: document
  });

  return callback(null, response);
};
