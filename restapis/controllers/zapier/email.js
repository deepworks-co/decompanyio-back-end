'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const wapper = new MongoWapper(mongodb.endpoint);
  const {documentId} = event.query;
  
  const start = Date.now() - (1000 * 60 * 60 * 24 * 1);
  const emails = await wapper.distinct(tables.TRACKING, "e", {id: documentId, n: {$gt: 1}, e: {$regex: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/}, t:{$gt: start}});

  const results = emails.map((e)=>{
    return {
      id: e,
      documentId: documentId
    }
  })
  
  console.log("results", results);

  return JSON.stringify(results);
};
