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