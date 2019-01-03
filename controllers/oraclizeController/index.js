'use strict';
const uuidv4 = require('uuid/v4');
module.exports.handler = (event, context, callback) => {
  const resultList = [];
  let yyyymmdd = getYYYYMMDD();
  if(event.queryStringParameters && event.queryStringParameters.d){
    yyyymmdd = event.queryStringParameters.d;
  }

  for(var i=0;i<500;i++){
    let item = {};
    item.id = uuidv4().replace(/-/gi, "");
    item.vc = getRndInteger(0, 1000);
    resultList.push(item);
  }


  const result  = {};
  result[yyyymmdd] = resultList;
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

const getYYYYMMDD = () => {
  var x = new Date();
  var y = x.getFullYear().toString();
  var m = (x.getMonth() + 1).toString();
  var d = x.getDate().toString();
  (d.length == 1) && (d = '0' + d);
  (m.length == 1) && (m = '0' + m);
  var yyyymmdd = y + m + d;
  return yyyymmdd;
}
