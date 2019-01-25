'use strict';
const AWS = require('aws-sdk');
AWS.config.update({
  region: "us-west-1",
});
const s3 = new AWS.S3();
const readline = require('readline');
const sqs = new AWS.SQS();
const utils = require('decompany-common-utils');
const MongoWapper = require('decompany-common-utils').MongoWapper;
const { mongodb } = require('../../resources/config.js').APP_PROPERTIES();


const TB_DOCUMENT = "DEV-CA-DOCUMENT";
const TB_PAGEVIEW = "DOCUMENT-PAGEVIEW";

exports.handler = async (event, context, callback) => {
    // TODO implement
    // key : viewcount/2018-10-18/004c938c-sdfas-sdf-asdf-sadf.csv
    // %40 => @

    const bucketName = event['Records'][0]['s3']['bucket']['name'];
    const key = event['Records'][0]['s3']['object']['key'];
    const strDate = key.split("/")[1].replace(/['"]+/g, '');
    console.log("Request Event", JSON.stringify(event));
    console.log("Request Event S3 ", bucketName, key, strDate);
    
    const params = {Bucket: bucketName, Key: key};
    const readStream = await s3.getObject(params).createReadStream().promise();
    console.log("readStream", readStream);
    const lineReader = readline.createInterface({
      input: readStream,
    });
    let i=0;
    let totalViewCount = 0;
    let totalViewCountSquare = 0;
    
    let blockchainTimestamp = utils.getBlockchainTimestamp(strDate);
    console.log(key, blockchainTimestamp);
    lineReader.on('line', (line) => {
 
        if(i > 0){
            console.log(line);
            const splits = line.split(",");
            const date = splits[0].replace(/['"]+/g, '');
            const documentId = splits[1].replace(/['"]+/g, '');
            const vc = splits[2].replace(/['"]+/g, '');
            const viewCount = getNumber(vc);
            
            blockchainTimestamp = utils.getBlockchainTimestamp(date);
       
            if (viewCount > 0) {
                totalViewCount += viewCount;
                totalViewCountSquare += Math.pow(viewCount, 2);
                console.log(documentId, viewCount, blockchainTimestamp);
                updateViewCount(documentId, viewCount, blockchainTimestamp);                       
                        
                  
                requestSQSRegistViewCountInBlockchain(accountId, documentId, getNumber(viewCount), blockchainTimestamp, context.awsRequestId).then((result)=>{
                    //logging
                    console.log(JSON.stringify({
                        message: "SUCCESS SQS Send",
                        date: date,
                        blockchainTimestamp: blockchainTimestamp,
                        accountId: accountId,
                        viewCount: viewCount,
                        documentId: documentId,
                        response: result
                        
                    }));
                }).catch((err) => {
                    //logging
                    console.error(JSON.stringify({
                        date: date,
                        blockchainTimestamp: blockchainTimestamp,
                        accountId: accountId,
                        documentId: documentId,
                        viewCount: viewCount,
                        error:err
                        
                    }));
                })

            }
        }
        i++;
    }).on('close', () => {
       
        
        const logParam = {
            message: "readline complete",
            totalViewCount : totalViewCount,
            totalViewCountSquare : totalViewCountSquare,
            date:blockchainTimestamp,
            count: i - 1
        };
        console.log(logParam);
        requestSQSRegistTotalViewCountInBlockchain(blockchainTimestamp, totalViewCount, totalViewCountSquare, i-1);
    });
  
    const resMsg = {
        functionName: context.functionName,
        bucketName: bucketName,
        key: key,
        message: "SUCCESS"
    }
    console.log(resMsg);
    
    const response = {
        statusCode: 200,
        body: JSON.stringify(resMsg)
    };
    
    callback(null, response);
};

function getNumber(number, defaultNumber) {
    return isNaN(parseInt(number, 10)) ? defaultNumber : parseInt(number, 10);
}

async function updateViewCount(documentId, pageView, blockchainTimestamp) {
    // Increment an atomic counter
  let params = {
    documentId: documentId,
    blockchainTimestamp: blockchainTimestamp
    
  }
  const wapper = new MongoWapper(mongodb.endpoint);
  const r = wapper.findOne(TB_PAGEVIEW, params);

  if(r){
    params.pageView = pageView;
    params.updated = Date.now();
  } else {
    parmas.pageView = pageView;
    params.created = Date.now();
    params.updated = Date.now();
  }
  
  await mongoWapper.save(TB_PAGEVIEW, params);

  console.log("saved pageview", params);
   
}

function requestSQSRegistViewCountInBlockchain(accountId, documentId, confirmViewCount, blockchainTimestamp, requestId){
    const params = {
        QueueUrl: "https://sqs.us-west-1.amazonaws.com/197966029048/DEV-CA-SC-VIEWCOUNT", /* required */
        MessageBody: JSON.stringify({
            accountId: accountId,
            documentId: documentId,
            confirmViewCount: confirmViewCount,
            date: blockchainTimestamp,
            requestId: requestId
        }),
        DelaySeconds: 0,
    };
    console.log("Sending SQS Parameter", params);
    return sqs.sendMessage(params).promise();
}

function requestSQSYesterdayVote(accountId, documentId){
    const params = {
        QueueUrl: "https://sqs.us-west-1.amazonaws.com/197966029048/DEV-CA-SC-YESTERDAYVOTES", /* required */
        MessageBody: JSON.stringify({
            accountId: accountId,
            documentId: documentId
        }),
        DelaySeconds: 0,
    };
    console.log("Sending SQS Yesterday Vote", params);
    return sqs.sendMessage(params).promise();
}



function requestSQSRegistTotalViewCountInBlockchain(blockchainTimestamp, totalViewCount, totalViewCountSquare, count, requestId){
    const params = {
        QueueUrl: "https://sqs.us-west-1.amazonaws.com/197966029048/DEV-CA-SC-TOTALVIEWCOUNT", /* required */
        MessageBody: JSON.stringify({
            date: blockchainTimestamp,
            totalViewCount: totalViewCount,
            totalViewCountSquare: totalViewCountSquare,
            count,
            requestId: requestId
        }),
        DelaySeconds: 0,
    };
    console.log("Sending SQS Parameter https://sqs.us-west-1.amazonaws.com/197966029048/DEV-CA-SC-TOTALVIEWCOUNT", params);
    return sqs.sendMessage(params).promise();
}

