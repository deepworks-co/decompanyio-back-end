'use strict';

module.exports.handler = (event, context, callback) => {
  const {principalId, body} = event;

  console.log(event);
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

};
