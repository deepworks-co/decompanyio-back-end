'use strict';
const { mongodb, tables} = require('decompany-app-properties');
const { MongoWapper } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
    /** Immediate response for WarmUp plugin */
    if (event.source === 'lambda-warmup') {
      console.log('WarmUp - Lambda is warm!')
      return callback(null, 'Lambda is warm!')
    }
  
    
  const promises = event.Records.map((record) =>  {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    const keys = key.split("/");

    const documentId = keys[1];
    const filename = keys[2];
    let flag = true;
    if(filename === 'false'){
      flag = false;
    }
    console.log(`documentId: ${documentId}, filename: ${filename}, flag : ${flag}`);
    return updateCompleteConvertPDF(documentId, flag);
  });

  const results = await Promise.all(promises);
  return results;
};


function updateCompleteConvertPDF(documentId, flag){

  if(!documentId){
    throw new Error("documentId is undefined");
  }

  return new Promise(async (resolve, reject)=>{
    const wrapper = new MongoWapper(mongodb.endpoint);

    try{
      let updateData = {$set: {pdf: flag}}
      const r = await wrapper.update(tables.DOCUMENT, {_id: documentId}, updateData);
      console.log(r);
      resolve(r);

      wrapper.close();
    } catch(err){
      reject(err);
      wrapper.close();
    } 

  })

}