'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const {utils, s3} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');


var AWS = require("aws-sdk");

AWS.config.update({
  region: region
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
  const useTracking = utils.parseBool(body.useTracking);
  const forceTracking = utils.parseBool(body.forceTracking);
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  const isDownload = utils.parseBool(body.isDownload);
  const cc = body.cc;
  const isPublic = utils.parseBool(body.isPublic, true);
  
  const user = await documentService.getUser(accountId);
  if(!user){
    throw new Error(`user(${accountId}) does not exist`);
  }

  let {check, privateDocumentCount} = await checkRegistrableDocument(accountId);
  if(check===false){
    //throw new Error('registry error, private document over 5');
    return callback(null, JSON.stringify({
      success: true,
      code: "EXCEEDEDLIMIT",
      privateDocumentCount: privateDocumentCount,
      message: 'Error Registry , You have at least 5 private documents.'
    }));
  }


  const seoTitle = await generateSeoTitle(title);
  const documentId = await generateDocumentId();;

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
      cc: cc,
      isPublic: isPublic,
      isBlocked: false,
      isDeleted: false
    }

    const result = await documentService.putDocument(putItem);
    
    if(result){
      let {check, privateDocumentCount} = await checkRegistrableDocument(accountId);

      console.log("PutItem succeeded:", result);
      
      //const signedUrl = s3.generateSignedUrl(accountId, documentId, ext);
      const documentKey = `FILE/${accountId}/${documentId}.${ext}`;
      const signedUrl = await s3.signedUploadUrl2({region: region, bucket: s3Config.document,  key: documentKey, signedUrlExpireSeconds: 60});
      const payload = {
        success: true,
        documentId: documentId,
        accountId: accountId,
        signedUrl: signedUrl,
        privateDocumentCount: privateDocumentCount
      };
      return callback(null, JSON.stringify(payload));
    } else {
      throw new Error("registration document fail");
    }

  }

};
async function checkRegistrableDocument(accountId){
  return await documentService.checkRegistrableDocument(accountId);
}
function generateDocumentId(){
  return new Promise(async (resolve, reject)=>{
    const documentId = uuidv4().replace(/-/gi, "");
    const document = await documentService.getDocumentById(documentId);
    console.log("generateDocumentId", documentId, JSON.stringify(document));
    if(document){
      resolve(generateDocumentId());
    }else {
      resolve(documentId);
    }
  })
}

function generateSeoTitle(title){
  return new Promise(async (resolve, reject)=>{
    const seoTitle = utils.toSeoFriendly(title);
    const friendlyUrl = await documentService.getFriendlyUrl(seoTitle);
    console.log("generateSeoTitle", seoTitle, JSON.stringify(friendlyUrl));
    if(friendlyUrl){
      resolve(generateSeoTitle());
    }else {
      resolve(seoTitle);
    }
  })
}
