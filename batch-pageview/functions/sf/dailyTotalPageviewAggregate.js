'use strict';

const {utils, MongoWrapper} = require('decompany-common-utils');
const { mongodb, tables} = require('decompany-app-properties');
const wrapper = new MongoWrapper(mongodb.endpoint);

module.exports.handler = async (event, context, callback) => {
  
  const {start, end} = event;
  
  //const startDate = utils.getDate(new Date(), -1);// new Date(now - 1000 * 60 * 60 * 24 * 10);  
  //const startTimestamp = !isNaN(start)? utils.getBlockchainTimestamp(new Date(start)): utils.getBlockchainTimestamp(startDate);
  //const endTimestamp = !isNaN(end)? utils.getBlockchainTimestamp(new Date(end)): utils.getBlockchainTimestamp(new Date());

  const startTimestamp = utils.getBlockchainTimestamp(new Date(start))
  const endTimestamp = utils.getBlockchainTimestamp(new Date(end))

  const list = await aggregatePageview(new Date(startTimestamp), new Date(endTimestamp))
  console.log("dailyTotalPageviewAggregate", new Date(startTimestamp), new Date(endTimestamp), list.length)
  await savePageview(list);
  
  const list2 = await aggregateTotalPageview(new Date(startTimestamp), new Date(endTimestamp))
  console.log("dailyTotalPageviewSquareAggregate", new Date(startTimestamp), new Date(endTimestamp), list.length)
  await saveTotalPageview(list2);
  
  return {
    success: true,
    start,
    end
  }
};

function aggregatePageview(start, end) {
  
  return new Promise((resolve, reject)=>{
 
    wrapper.aggregate(tables.AGGREGATE_PAGEVIEW, [{
      $match: {
        $and: [
          { blockchainDate: {$gte: start, $lt: end} },
          {
            $or: [
              { '_id.type': 'VIEW' },
              { '_id.type': 'DOWNLOAD' }
            ]
          }
        ]   
      }
    }, {
      $group: {
        _id: {
            year: '$_id.year',
            month: '$_id.month',
            dayOfMonth: '$_id.dayOfMonth',
            id: '$_id.documentId'
        },
        pageview: {
            $sum: 1
        }
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
          documentId: '$_id.documentId',
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
    }]).then((data) => {
      resolve(data)
    }).catch((err) => {
      reject(err)
    })
  })
  
}


function savePageview(list){
  return new Promise((resolve, reject)=>{

    const bulk = wrapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_DAILY);

    Promise.all(list.map((it)=>{
      return bulk.find({_id: it._id}).upsert().updateOne({$set: Object.assign(it, {created: Date.now(), createdAt: new Date()})});
    })).then((data)=>{
      return wrapper.execute(bulk)
    }).then((data)=>{
      resolve(data)
    }).catch((err)=>{
      reject(err)
    })
    
  })
}


function aggregateTotalPageview(start, end) {
  
  return new Promise((resolve, reject)=>{
        
    wrapper.aggregate(tables.STAT_PAGEVIEW_DAILY, [{
      $match: { 
        blockchainDate: { $gte: start, $lt: end } 
      },
    }, {
      $group: {
        _id: {
            year: '$_id.year',
            month: '$_id.month',
            dayOfMonth: '$_id.dayOfMonth'
        },
        totalPageview: {
            $sum: '$pageview'
        },
        totalPageviewSquare: {$sum: {$pow: ["$pageview", 2]}},
        count: {$sum: 1}
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
    }]).then((data) => {
      resolve(data)
    }).catch((err) => {
      reject(err)
    })
  })
  
}

function saveTotalPageview(list){
  return new Promise((resolve, reject)=>{

    const bulk = wrapper.getUnorderedBulkOp(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY);

    Promise.all(list.map((it)=>{
      return bulk.find({_id: it._id}).upsert().updateOne({$set: Object.assign(it, {created: Date.now, createdAt: new Date()})});
    })).then((data)=>{
      return wrapper.execute(bulk)
    }).then((data)=>{
      resolve(data)
    }).catch((err)=>{
      reject(err)
    })
    
  })
}