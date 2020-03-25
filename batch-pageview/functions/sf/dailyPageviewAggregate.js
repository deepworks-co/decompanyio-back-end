'use strict';

const {utils, MongoWrapper} = require('decompany-common-utils');
const { mongodb, tables} = require('decompany-app-properties');
const wrapper = new MongoWrapper(mongodb.endpoint);

module.exports.handler = async (event, context, callback) => {
  
  const {start, end} = event;
  // yesterday
  //const startDate = utils.getDate(new Date(), -1);// new Date(now - 1000 * 60 * 60 * 24 * 10);  
  //const startTimestamp = !isNaN(start)? util.getBlockchainTimestamp(new Date(start)): utils.getBlockchainTimestamp(startDate);
  //const endTimestamp = !isNaN(end)? util.getBlockchainTimestamp(new Date(end)): utils.getBlockchainTimestamp(new Date());

  const startTimestamp = utils.getBlockchainTimestamp(new Date(start))
  const endTimestamp = utils.getBlockchainTimestamp(new Date(end))

  const list = await aggregateDailyEvent(new Date(startTimestamp), new Date(endTimestamp))
  console.log("dailyPageviewAggregate", new Date(startTimestamp), new Date(endTimestamp), list.length)
  await saveDailyEvent(list);
  
  return {
    success: true,
    start,
    end
  }
};

function aggregateDailyEvent(start, end) {
  
  return new Promise((resolve, reject)=>{
        
    wrapper.aggregate(tables.EVENT, [
      {
        $match: {
          $and: [
            { type: "VIEW"},
            { createdAt: {$gte: start, $lt: end} },
            { "payload.n": {$gt: 1}}
          ]
        }
      }, {
        $group: {
          '_id': {
            type: '$type',
            year: {$year: '$createdAt'},
            month: {$month: '$createdAt'},
            dayOfMonth: {$dayOfMonth: '$createdAt'},
            documentId: '$payload.id',
            trackingId: {
              _cid: '$trackingIds._cid',
              _sid: "$trackingIds._sid"
            }
          },
          count: {
            '$sum': 1
          },
          pagenos: {
            $push: {n: '$payload.n', created: '$createdAt'}
          }
        }
    }, {
      $match: {
        count: {$gt: 1}
      }
    }, {
      $addFields: {
          blockchainDate: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.dayOfMonth'
            }
          },
          blockchainTimestamp: {
            $toLong: {
              $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.dayOfMonth'
              }
            }
          }
  
      }
    }]).then((data)=>{
      resolve(data)
    }).catch((err)=>{
      reject(err)
    })
  })
  
}


function saveDailyEvent(list){
  return new Promise((resolve, reject)=>{

    const bulk = wrapper.getUnorderedBulkOp(tables.AGGREGATE_PAGEVIEW);

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
