const AWS = require("aws-sdk");
const sns = new AWS.SNS();
/**
 * @param regions : 
 * @param querueUrl : 
 * @param messageBody
 */
exports.errorPublish = (topic, params) => {
    return sns.publish({
      Message: JSON.stringify(params),
      TopicArn: topic
    }).promise();
 }