'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('decompany-app-properties');



module.exports.handler = async (event, context, callback) => {
  
  const wapper = new MongoWapper(mongodb.endpoint);

  const sources = [tables.DOCUMENT, tables.DOCUMENT_POPULAR, tables.DOCUMENT_FEATURED];
  const outputs = [tables.TOP_TAG, tables.TOP_TAG_POPULAR, tables.TOP_TAG_FEATURED];


  const promises = sources.map(async (source, index)=>{
    const output = outputs[index];
    console.log(source, output);
    return await wapper.mapReduce(source, map, reduce, {out: output}); //{out: {inline: 1}}
  })
  
  const results = await Promise.all(promises);

  console.log(results);

  return "success";
};


function map() {
  if(this.state === "CONVERT_COMPLETE" && this.isBlocked === false && this.isDeleted === false && this.isPublic === true){
    this.tags.forEach(function (tag){
      emit(tag, 1);
    })
  }
}

function reduce(key, values) {

  return values.length;
}