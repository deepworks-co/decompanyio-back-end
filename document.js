'use strict';
const uuidv4 = require('uuid/v4');

const dynamo = require('./libs/dynamoUtil');

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "DEV-CA-DOCUMENT";

module.exports.regist = (event, context, callback) => {
  const accountId = "anonymous@infrawareglobal.com";
  const documentId = uuidv4();


  var postParams = JSON.parse(event.body);
  console.log("postParams", postParams.data);
  const documentName = postParams.data.filename;
  const documentSize = postParams.data.size;
  try{

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
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            if(data == null || data.length > 0){
              console.log("이미 해당 문서아이디가 존재 합니다.", documentId);
            } else {
              console.log("신규 문서아이디 입니다.", documentId);

              const putItem = {
                accountId:item.Key.accountId,
                documentId: item.Key.documentId,
                documentName: documentName,
                documentSize: documentSize
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

                callback(null, {
                  statusCode: statusCode,
                  body: JSON.stringify(message)
                });

              });

            }
        }
      });
  } catch(e){
      console.error(e);
  }

  console.log("regist end")

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};


module.exports.list = (event, context, callback) => {

  dynamo.queryDocumentByLatest(null, (err, data) => {
    if (err) {
        console.error("Unable to queryDocumentByLatest. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("queryDocumentByLatest succeeded.", data);
    }

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Go Serverless v1.0! Your function executed successfully!',
        resultList: data.Items?data.Items:[],
      }),
    });

  });

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
