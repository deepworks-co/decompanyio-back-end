'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const s3 = require('./documentS3');
const {utils} = require('decompany-common-utils');


var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

module.exports.regist = async (event, context, callback) => {
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
  
  
  let seoTitle;
  let documentId;
  let document;

  const user = await documentService.getUser(accountId);
  if(!user){
    throw new Error(`user(${accountId}) does not exist`);
  }



  do {
    documentId = uuidv4().replace(/-/gi, "");
    document = await documentService.getDocumentById(documentId);
  } while(document)
  
  let friendlyUrl;
  do {
    seoTitle = utils.toSeoFriendly(title);
    friendlyUrl = await documentService.getFriendlyUrl(seoTitle);
  } while(friendlyUrl)

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
      forceTracking: forceTracking
    }

    const result = await documentService.putDocument(putItem);
    
    if(result){
      console.log("PutItem succeeded:", result);
      const signedUrl = s3.generateSignedUrl(accountId, documentId, ext);
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


module.exports.list = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event", JSON.stringify(event));

  const params = event.method === "POST"?event.body:event.query;

  console.log("parameters", params);
  
  const pageNo = isNaN(params.pageNo)?1:Number(params.pageNo);
  const pageSize = isNaN(params.pageSize)?10:Number(params.pageSize);
  let accountId = params.accountId?decodeURI(params.accountId):null;
  const email = params.email?decodeURI(params.email):null;
  const username = params.username?decodeURI(params.username):null;
  const tag = params.tag;
  const path = params.path;
  const skip = ((pageNo - 1) * pageSize);

  const totalViewCountInfo = await documentService.getRecentlyPageViewTotalCount();

  if(!accountId && email){
    const user = await documentService.getUser({email:email});
    console.log("by email", user);
    accountId = user._id;
  } else if(!accountId && username) {
    const user = await documentService.getUser({username:username});
    console.log("by username", user);
    accountId = user._id;
  }

  const resultList = await documentService.queryDocumentList({
    pageNo: pageNo,
    accountId: accountId,
    tag: tag,
    path: path,
    pageSize: pageSize,
    skip: skip
  });
  
  return (null, JSON.stringify({
    success: true,
    resultList: resultList,
    pageNo: pageNo,
    count: resultList.length,
    totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
  }));


};


module.exports.info = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event : ", event.path);
  try{
    //console.log("context : ", context);
    let documentId = event.path.documentId;

    if(!documentId){
      throw new Error("parameter is invaild!!");
    }

    let document = null;

    if(!document){
      document = await documentService.getDocumentBySeoTitle(documentId);
      console.log("get document by seo title", document);
    }
    
    if(!document){
      document = await documentService.getDocumentById(documentId);
      console.log("get document by id", document);
    }  

    if(!document){
      
      return JSON.stringify({
        success: true,
        message: "document does not exist!",
      });
    }
    const promises = []
    //const author = await documentService.getUser(document.accountId);
    //console.log("author", author);
    promises.push(documentService.getUser(document.accountId));
    
    //const textList = await s3.getDocumentTextById(document._id);
    promises.push(s3.getDocumentTextById(document._id));

    //console.log(textList);

    promises.push(documentService.getRecentlyPageViewTotalCount());
    
    //const featuredList = await documentService.getFeaturedDocuments({documentId: document.documentId});
    promises.push(documentService.getFeaturedDocuments({documentId: document.documentId}));

    const results = await Promise.all(promises);

    const author = results[0];
    const textList = results[1];
    const totalViewCountInfo = results[2];
    const featuredList = results[3];
    

    const response = JSON.stringify({
        success: true,
        document: document,
        text: textList,
        featuredList: featuredList,
        author:author,
        totalViewCountInfo: totalViewCountInfo
      }
    );

    return (null, response);
  } catch(e) {
    console.error(e);
    throw e
  }
  
}

module.exports.downloadFile = async (event, context, callback) => {

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

  const documentName = document.documentName;
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  const signedUrl = s3.generateSignedUrl(document.accountId, document.documentId, ext);
  
  return JSON.stringify({
    success: true,
    downloadUrl: signedUrl,
    document: document
  });

}
