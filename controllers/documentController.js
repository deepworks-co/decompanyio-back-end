'use strict';
const uuidv4 = require('uuid/v4');

const dynamo = require('../utils/dynamoUtil');
const s3 = require('../utils/s3Util');

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
            accountId:item.Key.accountId,
            documentId: item.Key.documentId,
            nickname: nickname,
            documentName: documentName,
            documentSize: documentSize,
            ethAccount:ethAccount,
            title: title,
            desc: desc,
            tags:tags
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
                statusCode = 200;
                message = {
                  documentId: documentId,
                  accountId: accountId,
                  message: message
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

  console.log(body.params);

  dynamo.queryDocumentByLatest({
    nextPageKey: key,
    email: email,
    tag: tag
  }).then((data) => {

    //console.log("queryDocumentByLatest succeeded.", data);

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
        Count: data.Count
      }),
    });

  }).catch((err) => {

    console.error("Unable to queryDocumentByLatest. Error:", JSON.stringify(err, null, 2));
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

dynamo.getDocumentById(documentId).then((data) => {
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
