'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();


const TB_DOCUMENT = tables.DOCUMENT;
const TB_TOPTAG = tables.TOP_TAG;


module.exports.handler = async (event, context, callback) => {

  
  const wapper = new MongoWapper(mongodb.endpoint);
  const mapReduceResult = await wapper.mapReduce(TB_DOCUMENT, map, reduce, {out: TB_TOPTAG}); //{out: {inline: 1}}
  const resultList = await wapper.find(TB_TOPTAG, {});
  console.log(resultList);

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};


function map() {
  print("map" + JSON.stringify(this));
  this.tags.forEach(function (key){
    emit(key, 1);
  })
  
}

function reduce(key, values) {

  return values.length;
}