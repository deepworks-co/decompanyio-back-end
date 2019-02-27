'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const s3 = require('./documentS3');
const {utils} = require('decompany-common-utils');


var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const TABLE_NAME = "DEV-CA-DOCUMENT";

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}

module.exports.regist = async (event, context, callback) => {

  console.log("event", event.body);
  const parameter = JSON.parse(event.body);
  console.log("parameter", parameter);
  if(!parameter || !parameter.accountId || !parameter.title) {
    throw new Error("parameter is invalid");
  } 

  const accountId = parameter.accountId;
  const sub = parameter.sub;
  const nickname = parameter.nickname;
  const username = parameter.username;
  
  const documentName = parameter.filename;
  const documentSize = parameter.size;
  const tags = parameter.tags?parameter.tags:[];//document tags
  const ethAccount = parameter.ethAccount?parameter.ethAccount:null;//ethereum user account
  const title = parameter.title;
  const desc = parameter.desc;
  const category = parameter.category;
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();
  
  let seoTitle;
  let documentId;
  let document, friendUrl;

  do {
    documentId = uuidv4().replace(/-/gi, "");
    document = await documentService.getDocumentById(documentId);
  } while(document)
  
  do {
    seoTitle = utils.toSeoFriendly(title);
    friendUrl = await documentService.getFriendlyUrl(seoTitle);
  } while(friendUrl)

  if(!documentId || !seoTitle){
    throw new Error("The Document ID or Friendly SEO Title already exists. retry..." + JSON.stringify(document));
  } else {
    console.log("The new Document ID", documentId);

    const putItem = {
      _id: documentId,
      accountId: accountId,
      documentId: documentId,
      nickname: nickname,
      username: username,
      sub: sub,
      documentName: documentName,
      documentSize: documentSize,
      ethAccount: ethAccount,
      title: title,
      desc: desc,
      tags: tags,
      confirmViewCountHist: {},
      confirmVoteAmountHist: {},
      category: category,
      confirmViewCount: 0,
      confirmVoteAmount: 0,
      totalViewCount: 0,
      viewCount: 0,
      seoTitle: seoTitle
    }

    const result = await documentService.putDocument(putItem);
    
    if(result){
      console.log("PutItem succeeded:", result);
      const signedUrl = s3.generateSignedUrl(accountId, documentId, ext);
      const payload = {
        success: true,
        documentId: documentId,
        accountId: accountId,
        message: "SUCCESS",
        signedUrl: signedUrl
      };
      callback(null, {
        statusCode: 200,
        headers: defaultHeaders,
        body: JSON.stringify(payload)
      });
    } else {
      throw new Error("PutItme Fail " + JSON.stringify(putItem));
    }

  }
  

};


module.exports.list = (event, context, callback) => {
  console.log("event.body", event.body);
  const params = event.body?JSON.parse(event.body):{};
  
  const pageNo = (isNaN(params.pageNo) || params.pageNo<1)?1:Number(params.pageNo);
  const accountId = params.accountId;
  const tag = params.tag;
  const path = params.path;

  const promise1 = documentService.queryDocumentList({
    pageNo: pageNo,
    accountId: accountId,
    tag: tag,
    path: path

  });

  const date = utils.getBlockchainTimestamp(new Date());//today
  const promise2 = documentService.queryTotalViewCountByToday(date);


  Promise.all([promise1, promise2]).then((results) => {
    const result = results[0];
    const result2 = results[1];
    const resultList = result.resultList?result.resultList:[];
    const pageNo = isNaN(result.pageNo)?1:Number(result.pageNo);
    const totalViewCountInfo = result2;

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        message: 'SUCCESS',
        resultList: resultList,
        pageNo: pageNo,
        count: resultList.length,
        totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
      }),
    });

  }).catch((err) => {

    console.error("Exception queryDocumentList.", err);
    callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        error: err,
        message: 'FAIL',
      })
    });
  });
};

/**
 * @description voted documets
 * @url : /api/curator/document/list
 */
module.exports.listCuratorDocument = (event, context, callback) => {

  const body = JSON.parse(event.body);

  const pageNo = (isNaN(body.pageNo) || body.pageNo<1)?1:Number(body.pageNo);
  const accountId = body.accountId;
  const tag = body.tag;
  const path = body.path;


  const promise1 = documentService.queryVotedDocumentByCurator({
    pageNo: pageNo,
    accountId: accountId,
    tag: tag
  })

  const date = utils.getBlockchainTimestamp(new Date());//today
  const promise2 = documentService.queryTotalViewCountByToday(date);

  Promise.all([promise1, promise2]).then((results) => {
    console.log("listCuratorDocument succeeded.", JSON.stringify(results));
    const result = results[0];
    const resultList = result.resultList?result.resultList:[];
    const totalViewCountInfo = results[1]


    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        message: 'SUCCESS',
        resultList: resultList,
        pageKey: result.pageKey,
        count: resultList.length,
        totalViewCountInfo: totalViewCountInfo
      }),
    });

  }).catch((err) => {

    console.error("Unable to listCuratorDocument. Error:", err);
    callback(null, {
      success: false,
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        error: err,
      })
    });
  });
};

module.exports.listTodayVotedDocumentByCurator = (event, context, callback) => {

  const body = JSON.parse(event.body);
  const accountId = body.params.accountId;
  const tag = body.params.tag;
  const path = body.params.path;

  console.log(body.params);

  const promise1 = documentService.queryTodayVotedDocumentByCurator({
    accountId: accountId,
  });

  const today = new Date();
  const blockchainTimestamp = utils.getBlockchainTimestamp(today);

  const promise2 = documentService.queryTotalViewCountByToday(blockchainTimestamp);

  Promise.all([promise1, promise2]).then((results) => {

    console.log("listTodayVotedDocumentByCurator succeeded.", results);
    const data = results[0];
    const data2 = results[1];

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'SUCCESS',
        todayVotedDocuments: data.Items?data.Items:[],
        totalViewCount: data2.Items?data2.Items:[]
      }),
    });

  }).catch((err) => {

    console.error("Unable to listCuratorDocument. Error:", JSON.stringify(err, null, 2));
    callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'FAIL',
        err: err
      })
    });
  });
};


module.exports.info = async (event, context, callback) => {

  console.log("event : ", event.pathParameters);
  //console.log("context : ", context);
  let documentId = event.pathParameters.documentId;
  const seoTitle = event.pathParameters.documentId;

  if(!documentId && !seoTitle){
    throw new Error("parameter is invaild!!");
  }

  let document = null;
  
  if(documentId){
    document = await documentService.getDocumentById(documentId);  
  }

  if(!document && seoTitle){
    document = await documentService.getDocumentBySeoTitle(seoTitle);  
  }

  if(!document){
    throw new Error("document is not exist!");
  }

  const featuredList = await documentService.getFeaturedDocuments({documentId: document.documentId});


  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(
      {
        success: document?true:false,
        message: document?"SUCCESS":"Document is not exist",
        document: document,
        featuredList: featuredList
      }
    )
  };

  return (null, response);
}

module.exports.text = (event, context, callback) => {

  //console.log(event);
  const documentId = event.pathParameters.documentId;

  if(!documentId) return;
  //console.log(documentId);
  s3.getDocumentTextById(documentId).then((data) => {
    //console.info(data);

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        text: data.Body.toString("utf-8").substring(0, 3000)
      }),
    });

  }).catch((err) => {
    console.err("Get Text Error", err);
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        text: "NO Text",
        error:err
      }),
    });
  });



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
