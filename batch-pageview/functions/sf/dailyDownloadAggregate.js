'use strict';

const {utils, MongoWrapper} = require('decompany-common-utils');
const { mongodb, tables} = require('decompany-app-properties');
const wrapper = new MongoWrapper(mongodb.endpoint);

module.exports.handler = async (event, context, callback) => {
  const {start, end} = event;

  const now = Date.now();
  const startDate = new Date(now - 1000 * 60 * 60 * 24 * 1);
  
  const startTimestamp = utils.getBlockchainTimestamp(startDate);
  const endTimestamp = utils.getBlockchainTimestamp(new Date(now));

  const list = await aggregateDailyDownloadEvent(new Date(startTimestamp), new Date(endTimestamp))

  await saveDailyDownloadEvent(list);
  
  return JSON.stringify({
    success: true
  })
};

function aggregateDailyDownloadEvent(start, end) {
  return new Promise((resolve, reject)=>{
    wrapper.aggregate(tables.EVENT, [
      {
        $match: {
          $and: [
            { type: "DOWNLOAD" },
            { createdAt: {$gte: start, $lt: end} },
          ]
        }
      }, {
        $group: {
          '_id': {
            type: '$type',
            year: {$year: '$createdAt'},
            month: {$month: '$createdAt'},
            dayOfMonth: {$dayOfMonth: '$createdAt'},
            documentId: '$payload.documentId',
            trackingId: {_tid: '$trackingIds._tid'}
          },
          count: {
            '$sum': 1
          }
        }
    }]).then((data)=>{
      resolve(data)
    }).catch((err)=>{
      reject(err)
    })
  })
  
}


function saveDailyDownloadEvent(list){
  return new Promise((resolve, reject)=>{

    const bulk = wrapper.getUnorderedBulkOp(tables.EVENT_AGGREGATE);

    Promise.all(list.map((it)=>{
      return bulk.find({_id: it._id}).upsert().updateOne({$set: Object.assign(it, {createdAt: new Date()})});
    })).then((data)=>{
      return wrapper.execute(bulk)
    }).then((data)=>{
      resolve(data)
    }).catch((err)=>{
      reject(err)
    })
    
  })
}
