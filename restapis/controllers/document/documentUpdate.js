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
  const {documentId, desc, title, tags, useTracking, forceTracking, isDownload, cc, shortUrl, isPublic, isDeleted} = body;

  //console.log(body);

  if(!documentId){
    throw new Error("[404] document id is invalid");
  }

  const document = await documentService.getDocumentById(documentId);

  if(!document){
    throw new Error(`[404] document does not exists ${documentId}`);
  }

  if(!principalId || document.accountId !== principalId){
    throw new Error("[403] no permission");
  }

  const newDoc = {_id: document._id};
  if(desc){
    newDoc.desc = desc;
  }
  
  if(title && title !== document.title) {
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

  if(useTracking !== undefined){
    newDoc.useTracking = utils.parseBool(useTracking);
  } 

  if(forceTracking !== undefined){
    newDoc.forceTracking = utils.parseBool(forceTracking);
  } 

  if(isDownload !== undefined){
    newDoc.isDownload = utils.parseBool(isDownload);
  } 

  if(cc){
    newDoc.cc = cc;
  } 

  if(shortUrl){
    newDoc.shortUrl = shortUrl;
  }

  if(isPublic !== undefined){
    newDoc.isPublic = utils.parseBool(isPublic);
    if(newDoc.isPublic===false){
      const check = await documentService.checkRegistrableDocument(principalId);
      if(check===false){
        //throw new Error('registry error, private document over 5');
        return callback(null, JSON.stringify({
          success: false,
          code: "EXCEEDEDLIMIT",
          message: 'Error Update , You have at least 5 private documents.'
        }));
      }

      if(document.isRegistry === true){
        return callback(null, JSON.stringify({
          success: false,
          code: "REGISTRYINBLOCKCHAIN",
          message: 'Error Update , registry in blockchain'
        }));
      }
    }
  }

  if(isDeleted !== undefined){
    newDoc.isDeleted = utils.parseBool(isDeleted);
    newDoc.deleted = Date.now();
  }

  const response =  {
    success: true
  };
  console.log("newDoc", newDoc, Object.keys(newDoc));
  if(Object.keys(newDoc).length>1){
    newDoc.updated = Date.now();
    const result = await documentService.updateDocument(newDoc);
    //console.log("update document", result);
  
    response.result = result;
  } 

  return JSON.stringify(response);
};
