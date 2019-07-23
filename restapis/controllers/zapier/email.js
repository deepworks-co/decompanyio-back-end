'use strict';
const { mongodb, tables, applicationConfig } = require('decompany-app-properties');
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

  const doc = await getDocument(wapper, documentId, principalId);

  if(!doc){
    //console.log("document nothing", {_id: documentId, accountId: principalId, useTracking: true})
    //return JSON.stringify([]);
    throw new Error("[404] Not Found");
  }

  let host = applicationConfig.mainHost;
  if(host.slice(-1) !== "/"){
    host += "/";
  }
  const {author} = doc;
  const url = `${host}${author.username?author.username:author.email}/${doc.seoTitle}`;
  //console.log(url);
  //console.log("tracking doc is\r\n", doc);
  const start = 0;//Date.now() - (1000 * 60 * 60 * 24 * 1);
  const emails = await wapper.distinct(tables.TRACKING_USER, "e", {id: documentId, e: {$regex: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/}, created:{$gt: start}});
 
  
  const results = emails.map((e)=>{
    return {
      id: e,
      documentId: documentId,
      title: doc.title,
      url: url,
      shortUrl: doc.shortUrl
    }
  })
  
  wapper.close();

  console.log("search email results", results);

  return JSON.stringify(results);
};

async function getDocument(wapper, documentId, principalId) {

  const queryPipline = [
    {
      $match: {
        _id: documentId, isDeleted: false, isBlocked: false, accountId: principalId, useTracking: true
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accountId",
        foreignField: "_id",
        as: "author"
      }
    }, {
      $unwind: {
        path: "$author",
        preserveNullAndEmptyArrays: false
      }
    }
  ]
  const doc = await wapper.aggregate(tables.DOCUMENT, queryPipline);
  return doc[0];
}