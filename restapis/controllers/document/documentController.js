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
    throw new Error(`user(${accountId}) is not exists`);
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
  const date = utils.getBlockchainTimestamp(new Date());//today
  const totalViewCountInfo = await documentService.queryTotalViewCountByToday(date);

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
      //throw new Error("document is not exists!");
      return JSON.stringify({
        success: true,
        message: "document is not exists!",
      });
    }
  
    const author = await documentService.getUser(document.accountId);
    console.log("author", author);
    
    let textList = await s3.getDocumentTextById(document._id);

    //console.log(textList);
    
    const featuredList = await documentService.getFeaturedDocuments({documentId: document.documentId});

    const response = JSON.stringify({
        success: true,
        document: document,
        text: textList,
        featuredList: featuredList,
        author:author
      }
    );

    return (null, response);
  } catch(e) {
    console.error(e);
    throw e
  }
  
}

module.exports.vote = (event, context, callback) => {

  //console.log(event);
  const documentId = event.pathParameters.documentId;
  const params = JSON.parse(event.body);

  console.log("params", params);
  if(!documentId) return;

  const promise1 = documentService.putVote(params);
  const promise2 = documentService.updateVoteHist(params);

  Promise.all([promise1, promise2]).then((results) => {
    //for view count log
    const data = results[0]; //putVote
    const result2 = results[1]; //putVoteHist 사용안함

    console.log("Put Vote", data);
    console.log("Put VoteHist", result2)

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'SUCCESS',
        vote: data
      }),
    });
  }).catch((errs) => {
    console.error("Vote error : ", errs);

    callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: errs
        }),
    });
  });
}

module.exports.downloadFile = async (event, context, callback) => {

  const {query} = event;
  const {documentId} = query;

  if(!documentId ) {
    throw new Error("parameter is invalid!!!");
  }

  const document = await documentService.getDocumentById(documentId);
  console.log("document", document);

  if(!document){
    throw new Error("document is not exists!!!");
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
