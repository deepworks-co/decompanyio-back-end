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

  return (null, "success");
};


function map() {
  this.tags.forEach(function (tag){
    emit(tag, 1);
  })
  
}

function reduce(key, values) {

  return values.length;
}