'use strict';
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-1'});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
const QUEUE_URL = "https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-pdf-converter"

module.exports = () => {
    
    return new Promise((resolve, reject)=>{
        getMessage(QUEUE_URL)
        .then((message)=>{
            return message
        })
        .then(async (message)=>{

            await removeMessage({
                queueUrl: QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle
            });
            //console.log("message", message);
            return message;
        })
        .then((message)=>{
            resolve(message);
        })
        .catch((err)=>{
            reject(err);
        })
    });
}

function getMessage(queueURL){
    return new Promise((resolve, reject)=>{

        var params = {
            QueueUrl: queueURL,
            MaxNumberOfMessages: 1,
            VisibilityTimeout: 0,
            WaitTimeSeconds: 0
        };
        sqs.receiveMessage(params, function(err, data) {
            if (err) {
                //console.log("Receive Error", err);
                reject(err);
            } else if (data.Messages) {
                //console.log("Receive message", data);
                resolve(data.Messages[0]?data.Messages[0]:undefined);
            }  else {
                reject("EmptyMessage")
            }
        });

    })
}

function removeMessage(message){
    return new Promise((resolve, reject)=>{
        const {ReceiptHandle, queueUrl} = message;

        if(!ReceiptHandle || !queueUrl){
            return reject("ReceiptHandle or queueUrl is invalid");
        }

        const deleteParams = {
            QueueUrl: queueUrl,
            ReceiptHandle: ReceiptHandle
        };
        sqs.deleteMessage(deleteParams, function(err, data) {
        if (err) {
            console.log("Delete Error", err);
            reject(err);
        } else {
            console.log("Message Deleted", data);
            resolve(data);
        }
        });
    })
}
