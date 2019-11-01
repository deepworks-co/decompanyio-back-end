const AWS = require("aws-sdk");

/**
 * @param regions : 
 * @param querueUrl : 
 * @param messageBody
 */
exports.errorPublish = (region, topic, params) => {
  const sns = new AWS.SNS({region: region});
  return sns.publish({
    Message: JSON.stringify(params),
    TopicArn: topic
  }).promise();
 }