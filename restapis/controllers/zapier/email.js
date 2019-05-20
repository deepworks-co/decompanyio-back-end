'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  console.log(JSON.stringify(event));
  const wapper = new MongoWapper(mongodb.endpoint);
  const {principalId} = event;
  const {documentId} = event.query;

  const doc = await wapper.findOne(tables.DOCUMENT, {_id: documentId, accountId: principalId, useTracking: true});

  if(!doc){
    console.log("document nothing", {_id: documentId, accountId: principalId, useTracking: true})
    return JSON.stringify([]);
  }
  console.log("tracking doc is\r\n", doc);
  const start = Date.now() - (1000 * 60 * 60 * 24 * 1);
  const emails = await wapper.distinct(tables.TRACKING_USER, "e", {id: documentId, e: {$regex: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/}, created:{$gt: start}});

  const results = emails.map((e)=>{
    return {
      id: e,
      documentId: documentId
    }
  })
  
  console.log("search email results", results);

  return JSON.stringify(results);
};
