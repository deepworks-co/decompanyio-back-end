'use strict';
const uuidv4 = require('uuid/v4');

const dynamo = require('./documentDynamo');
const s3 = require('./documentS3');
const utils = require('../functions/commons/utils');

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "DEV-CA-DOCUMENT";

const defaultHeader = {
  stage: process.env.stage
}

module.exports.regist = (event, context, callback) => {
try{
  const parameter = JSON.parse(event.body).data;
  console.log(parameter, parameter);
  if(!parameter || !parameter.username) return callback(null, {
    statusCode: 203,
    body: JSON.stringify("parameter or user is invalid")
  });

  const accountId = parameter.username;
  const nickname = parameter.nickname;
  const documentId = uuidv4().replace(/-/gi, "");
  const documentName = parameter.filename;
  const documentSize = parameter.size;
  const tags = parameter.tags?parameter.tags:[];//document tags
  const ethAccount = parameter.ethAccount?parameter.ethAccount:null;//ethereum user account
  const title = parameter.title;
  const desc = parameter.desc;
  const category = parameter.category;
  const ext  = documentName.substring(documentName.lastIndexOf(".") + 1, documentName.length).toLowerCase();


  var item = {
      TableName: TABLE_NAME,
      Key:{
          "accountId": accountId,
          "documentId": documentId
      }
  };

  docClient.get(item, (err, data) => {
    if (err) {
          console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
          return callback(null, {
            statusCode: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(err, null, 2)
          });
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

        if(data == null || data.length > 0){
          console.log("이미 해당 문서아이디가 존재 합니다.", documentId);
        } else {
          console.log("신규 문서아이디 입니다.", documentId);

          const putItem = {
            accountId: item.Key.accountId,
            documentId: item.Key.documentId,
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

          dynamo.putDocument(putItem, (err, data) => {

            let statusCode = 200;
            let message = "SUCCESS";
            if (err) {
                console.error("PutItem Error JSON:", JSON.stringify(err, null, 2));
                statusCode = 500;
                message = err;
            } else {
                console.log("PutItem succeeded:");
                const signedUrl = s3.generateSignedUrl(accountId, documentId, ext);
                statusCode = 200;
                message = {
                  documentId: documentId,
                  accountId: accountId,
                  message: message,
                  signedUrl: signedUrl
                };
            }

            return callback(null, {
              statusCode: statusCode,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
              body: JSON.stringify(message)
            });

          });

        }
      }
    });
} catch(e){
    console.error(e);
    return callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(e)
    });
}



// Use this code if you don't use the http event with the LAMBDA-PROXY integration
// return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};


module.exports.list = (event, context, callback) => {

  const body = JSON.parse(event.body);

  const key = body.params.nextPageKey?JSON.parse(Buffer.from(JSON.stringify(body.params.nextPageKey), 'base64').toString()):null;
  const email = body.params.email;
  const tag = body.params.tag;
  const path = body.params.path;
  console.log(body.params);



  const promise1 = dynamo.queryDocumentByLatest({
    nextPageKey: key,
    email: email,
    tag: tag,
    path: path

  });

  const date = utils.getBlockchainTimestamp(new Date());//today
  const promise2 = dynamo.queryTotalViewCountByToday(date);


  Promise.all([promise1, promise2]).then((datas) => {
    const data = datas[0];
    const data2 = datas[1];
    console.log("queryDocumentByLatest succeeded.", data2);

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'SUCCESS',
        resultList: data.Items?data.Items:[],
        nextPageKey: data.LastEvaluatedKey,
        count: data.Count,
        totalViewCountInfo: data2.Items?data2.Items[0]:null
      }),
    });

  }).catch((err) => {

    console.error("Unable to queryDocumentByLatest. Error:", JSON.stringify(err, null, 2));
    callback(null, {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'FAIL',
      })
    });
  });
};

module.exports.listCuratorDocument = (event, context, callback) => {

  const body = JSON.parse(event.body);

  const key = body.params.nextPageKey?JSON.parse(Buffer.from(JSON.stringify(body.params.nextPageKey), 'base64').toString()):null;
  const accountId = body.params.accountId;
  const tag = body.params.tag;
  const path = body.params.path;

  console.log(body.params);

  const promise1 = dynamo.queryDocumentByCurator({
    nextPageKey: key,
    accountId: accountId,
    tag: tag
  }).then((data) => {

    console.log("listCuratorDocument succeeded.", data);

    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'SUCCESS',
        resultList: data.Items?data.Items:[],
        nextPageKey: data.LastEvaluatedKey,
        count: data.Count
      }),
    });

  }).catch((err) => {

    console.error("Unable to listCuratorDocument. Error:", JSON.stringify(err, null, 2));
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'FAIL',
      })
    });
  });
};


module.exports.info = (event, context, callback) => {

//console.log(event);
const documentId = event.pathParameters.documentId;

if(!documentId) return;

const promise1 = dynamo.getDocumentById(documentId)

const promise2 = dynamo.getDocumentsOrderByViewCount();

Promise.all([promise1, promise2]).then((results) => {

  const data = results[0];
  const data2 = results[1];
  //for view count log
  console.log("VIEWLOG", data.Items[0].documentId);

  callback(null, {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: 'SUCCESS',
      document: data.Items[0],
      list: data2.Items
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
        message: err
      }),
    });

  });
}

module.exports.text = (event, context, callback) => {

  //console.log(event);
  const documentId = event.pathParameters.documentId;

  if(!documentId) return;

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

  dynamo.putVote(params).then((data) => {
    //for view count log
    console.log("Put Vote", data);

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
  }).catch((err) => {
    console.error("Vote error : ", err);

    callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: err
        }),
    });
  });
}
