var AWS = require("aws-sdk");

/**
 * @param regions : 
 * @param querueUrl : 
 * @param messageBody
 */
exports.sendMessage = (region, querueUrl, messageBody) => {
    const sqs = new AWS.SQS({region: region});
    const params = {
        QueueUrl: querueUrl,
        MessageBody: messageBody,
        DelaySeconds: 0,
    };
    
    return sqs.sendMessage(params).promise();
 }


 exports.deleteMessage = (region, queueUrl, receiptHandle)=>{
    const sqs = new AWS.SQS({region: region});
    const params = {
       QueueUrl: queueUrl,
       ReceiptHandle: receiptHandle
    };
    
    return sqs.deleteMessage(params).promise();
 }