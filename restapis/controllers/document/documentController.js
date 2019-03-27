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
  const tags = body.tags?body.tags:[];//document tags
  const ethAccount = body.ethAccount?body.ethAccount:null;//ethereum user account
  const title = body.title;
  const desc = body.desc;
  const useTracking = body.useTracking?body.useTracking:false
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  
  
  let seoTitle;
  let documentId;
  let document;

  const user = await documentService.getUser(accountId);
  if(!user){
    throw new Error(`user(${accountId}) is not exists`);
  }

  if(user.ethAccount && user.ethAccount !== ethAccount){ //이미 유저의 소셜 계정과 맵핑된 ethereum account가 있지만 문서 등록시 전달 받은 정보가 상이 할 경우
    throw new Error("It is not a registered ethereum account.");
  } else if(!user.ethAccount && ethAccount) { //최초 등록된 ethereum account가 없고 전달받은 ethAccount가 있을경우...
    documentService.updateUserEthAccount(accountId, ethAccount);
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
      useTracking: useTracking
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
  console.log("event", event);

  try{
    let params = event.body;
    if(typeof(event.body)==='string'){
      params = body?JSON.parse(body):{};
    } 
    
    const pageNo = isNaN(params.pageNo)?1:Number(params.pageNo);
    const pageSize = isNaN(params.pageSize)?10:Number(params.pageSize);
    const accountId = params.accountId;
    const tag = params.tag;
    const path = params.path;
    const skip = ((pageNo - 1) * pageSize);
    const date = utils.getBlockchainTimestamp(new Date());//today
    const totalViewCountInfo = await documentService.queryTotalViewCountByToday(date);
    
    const resultList = await documentService.queryDocumentList({
      pageNo: pageNo,
      accountId: accountId,
      tag: tag,
      path: path,
      pageSize: pageSize,
      skip: skip
    });
    
    return (null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        resultList: resultList,
        pageNo: pageNo,
        count: resultList.length,
        totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
      }),
    });

  } catch(e) {
    console.error("Error queryDocumentList.", e);
    return (e, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        error: e.message
      })
    });
  }
  


};


module.exports.info = async (event, context, callback) => {

  console.log("event : ", event.path);
  //console.log("context : ", context);
  let documentId = event.path.documentId;

  if(!documentId){
    throw new Error("parameter is invaild!!");
  }

  let document = null;

  if(!document){
    document = await documentService.getDocumentBySeoTitle(documentId);  
  }
  
  if(!document){
    document = await documentService.getDocumentById(documentId);  
  }  

  if(!document){
    throw new Error("document is not exist!");
  }
  console.log("document : ", document);
  
  let textList = await s3.getDocumentTextById(document._id);

  //console.log(textList);
  
  const featuredList = await documentService.getFeaturedDocuments({documentId: document.documentId});


  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(
      {
        success: document? true:false,
        message: document? "SUCCESS":"Document is not exist",
        document: document,
        text: textList,
        featuredList: featuredList
      }
    )
  };

  return (null, response);
}

module.exports.text = async (event, context, callback) => {

  //console.log(event);
  const documentId = event.pathParameters.documentId;

  if(!documentId) return;

  let text = await s3.getDocumentTextById(documentId);

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(
      {
        success: true,
        text: text
      }
    )
  };

  return (null, response);
};

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
  try{
    //console.log(event);
    const documentId = event.pathParameters.documentId;
    const accountId = event.pathParameters.accountId;

    if(!documentId || !accountId) {
      callback(null, {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify({
            message: "parameter is invaild"
          }),
        });

      return;
    }
  
    const document = await documentService.getDocumentById(documentId);
    console.log("GetItem", document);
    const documentName = document.documentName;
    const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
    const signedUrl = s3.generateSignedUrl(document.accountId, document.documentId, ext);
    callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          success: true,
          downloadUrl: signedUrl,
          document: document
        }),
    });

  } catch(e) {
    console.error(e);
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        error: e
      }),
    });
  }

}
