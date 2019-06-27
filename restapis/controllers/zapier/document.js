'use strict';
const { mongodb, tables } = require('decompany-app-properties');
const { MongoWapper, utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  console.log(JSON.stringify(event));

  let {query} = event;
  const limit = 20;
  let next = query && !isNaN(query.next)?(query.next):0;
  const skip = next * limit;
  
  const wapper = new MongoWapper(mongodb.endpoint);
  const {principalId} = event;
  const queryPipeline = [
    {
      $match: {state: "CONVERT_COMPLETE", accountId: principalId, useTracking: true}
    }, {
      $sort: {created: -1}
    }, {
      $project: {
        _id: 0,
        id: "$_id",
        title: 1
      }
    }, {
      $skip: skip
    }, {
      $limit: limit
    }
  ]
  const docs = await wapper.aggregate(tables.DOCUMENT, queryPipeline);

  return JSON.stringify(docs);
};
