'use strict';
const uuidv4 = require('uuid/v4');
module.exports.handler = (event, context, callback) => {
  var result = [];
  for(var i=0;i<500;i++){
    let item = {};
    item.id = uuidv4().replace(/-/gi, "");
    item.viewcount = getRndInteger(0, 1000);
    result.push(item);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(result),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

const getRndInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min) ) + min;
}
