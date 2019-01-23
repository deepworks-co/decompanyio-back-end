'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const s3 = require('./documentS3');
const utils = require('decompany-common-utils');


var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const TABLE_NAME = "DEV-CA-DOCUMENT";

const defaultHeader = {
  stage: process.env.stage
}

module.exports.regist = async (event, context, callback) => {
  try{
    console.log("event", event.body);
    const parameter = JSON.parse(event.body);
    console.log("parameter", parameter);
    if(!parameter || !parameter.userid) return callback(null, {
      statusCode: 203,
      body: JSON.stringify({
        success: false,
        error: "user.id data is invalid"
      })
    });

    const accountId = parameter.userid;
    const nickname = parameter.nickname;
    const username = parameter.username;
    const documentId = uuidv4().replace(/-/gi, "");
    const documentName = parameter.filename;
    const documentSize = parameter.size;
    const tags = parameter.tags?parameter.tags:[];//document tags
    const ethAccount = parameter.ethAccount?parameter.ethAccount:null;//ethereum user account
    const title = parameter.title;
    const desc = parameter.desc;
    const category = parameter.category;
    const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();

    const document = await documentService.getDocumentById(documentId);

    if(document){
      throw new Error("The Document ID already exists. retry..." + JSON.stringify(document));
    } else {
      console.log("The new Document ID", documentId);

      const putItem = {
        accountId: accountId,
        documentId: documentId,
        nickname: nickname,
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
        viewCount: 0
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
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
          },
          body: JSON.stringify(payload)
        });
      } else {
        throw new Error("PutItme Fail " + JSON.stringify(putItem));
      }

    }
  
  } catch(e){

    console.error("regist exception", e);
    callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        error: e
      })
    });
  }
  
// Use this code if you don't use the http event with the LAMBDA-PROXY integration
// return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};


module.exports.list = (event, context, callback) => {

  const body = event.body?JSON.parse(event.body):{};

  const params = body.params?body.params:body;

  const pageKey = params.pageKey?JSON.parse(Buffer.from(JSON.stringify(params.pageKey), 'base64').toString()):null;
  const accountId = params.accountId;
  const tag = params.tag;
  const path = params.path;

  const promise1 = documentService.queryDocumentByLatest({
    pageKey: pageKey,
    accountId: accountId,
    tag: tag,
    path: path

  });

  const date = utils.getBlockchainTimestamp(new Date());//today
  const promise2 = documentService.queryTotalViewCountByToday(date);


  Promise.all([promise1, promise2]).then((datas) => {
    const resultList = datas[0].resultList?datas[0].resultList:[];
    const pageNo = !isNaN(datas[0].pageNo) && datas[0].pageNo>0? datas[0].pageNo : 1;
    const pageKey = datas[0].pageKey;
    const totalViewCountInfo = datas[1];

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
        pageKey: pageKey,
        count: resultList.length,
        totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
      }),
    });

  }).catch((err) => {

    console.error("Exception queryDocumentByLatest.", err);
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

module.exports.listCuratorDocument = (event, context, callback) => {

  const body = JSON.parse(event.body);

  const pageKey = body.params.pageKey?JSON.parse(Buffer.from(JSON.stringify(body.params.pageKey), 'base64').toString()):null;
  const accountId = body.params.accountId;
  const tag = body.params.tag;
  const path = body.params.path;

  console.log(body.params);

  const promise1 = documentService.queryVotedDocumentByCurator({
    pageKey: pageKey,
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
        message: 'FAIL',
        err: err
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


module.exports.info = (event, context, callback) => {

  //console.log(event);
  const documentId = event.pathParameters.documentId;

  if(!documentId) return;

  const promise1 = documentService.getDocumentById(documentId) //Promise.resolve({documentId: "asfdasf"});

  const promise2 = documentService.getFeaturedDocuments({documentId: documentId});

  Promise.all([promise1, promise2]).then((results) => {

    const document = results[0];
    const featuredList = results[1];
    //console.log("query ok", results);


    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: true,
        message: 'SUCCESS',
        document: document,
        featuredList: featuredList
      }),
    });

  }).catch((err) => {
    console.error("error : ", err);

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        message: err
      }),
    });

  });
}

module.exports.text = (event, context, callback) => {

  //console.log(event);
  const documentId = event.pathParameters.documentId;

  if(!documentId) return;
  console.log(documentId);
  s3.getDocumentTextById(documentId).then((data) => {
    console.info(data);

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
    const result2 = results[1]; //putVoteHist

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
