'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const {utils, s3} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');


var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});


module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event", JSON.stringify(event));
  const {principalId, body} = event;

     
  if(!body || !body.title || !body.tags) {
    throw new Error("parameter is invalid");
  } 

  if(!principalId){
    throw new Error("authorized user is invalid!!")
  }

  const accountId = principalId;    
  const documentName = body.filename;
  const documentSize = body.size;
  const tags = body.tags?body.tags.map((tag)=>tag.toLowerCase()):[];//document tags
  const ethAccount = body.ethAccount?body.ethAccount:null;//ethereum user account
  const title = body.title;
  const desc = body.desc;
  const useTracking = body.useTracking?body.useTracking:false
  const forceTracking = body.forceTracking?body.forceTracking:false
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  const isDownload = body.isDownload?body.isDownload:false;
  const cc = body.cc;
  
  
  let seoTitle;
  let documentId;
  let document;

  const user = await documentService.getUser(accountId);
  if(!user){
    throw new Error(`user(${accountId}) does not exist`);
  }


  let loop=0;
  do {
    documentId = uuidv4().replace(/-/gi, "");
    document = await documentService.getDocumentById(documentId);
    loop++;
  } while(document)
  console.log("create documentId", documentId, "loop", loop);
  let friendlyUrl;
  loop =0;
  do {
    seoTitle = utils.toSeoFriendly(title);
    friendlyUrl = await documentService.getFriendlyUrl(seoTitle);
  } while(friendlyUrl)



  console.log("create seoTitle", seoTitle, "loop", loop);

  if(!documentId || !seoTitle){
    throw new Error("The Document ID or Friendly SEO Title already exists. retry..." + JSON.stringify(document));
  } else {
    console.log("The new Document ID", documentId);

    const putItem = {
      _id: documentId,
      accountId: accountId,
      documentId: documentId,
      documentName: documentName,
      documentSize: documentSize,
      ethAccount: ethAccount,
      title: title,
      desc: desc,
      tags: tags,
      seoTitle: seoTitle,
      useTracking: useTracking,
      forceTracking: forceTracking,
      isDownload: isDownload,
      cc: cc
    }

    const result = await documentService.putDocument(putItem);
    
    if(result){
      console.log("PutItem succeeded:", result);
      
      //const signedUrl = s3.generateSignedUrl(accountId, documentId, ext);
      const documentKey = `FILE/${accountId}/${documentId}.${ext}`;
      const signedUrl = await s3.signedUploadUrl2({region: region, bucket: s3Config.document,  key: documentKey, signedUrlExpireSeconds: 60});
      const payload = {
        success: true,
        documentId: documentId,
        accountId: accountId,
        signedUrl: signedUrl
      };
      return callback(null, JSON.stringify(payload));
    } else {
      throw new Error("registration document fail");
    }

  }

};
