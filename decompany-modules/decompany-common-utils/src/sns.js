const AWS = require("aws-sdk");
const sns = new AWS.SNS();
/**
 * @param regions : 
 * @param querueUrl : 
 * @param messageBody
 */
exports.errorPublish = (topic, params) => {
    const sns = new AWS.SQS({region: region});
    return sns.publish({
      Message: JSON.stringify(params),
      TopicArn: topic
    }).promise();
 }