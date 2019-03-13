'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();


const TB_TRACKING = tables.TRACKING;
const TB_STAT_PAGEVIEW_DAILY = tables.STAT_PAGEVIEW_DAILY;
module.exports.handler = async (event, context, callback) => {
  //const startTimestamp = new Date(now - 1000 * 60 * 60 * 1); //1시간전
  //UTC기준의 어제 timestamp
  const now = new Date();
  const yesterday = new Date(now - 1000 * 60 * 60 * 24);
  const startTimestamp = utils.getBlockchainTimestamp(yesterday);
  console.log("query start timestamp", startTimestamp, new Date(startTimestamp));
  const wapper = new MongoWapper(mongodb.endpoint);

  const queryPipeline = [{
    $match: {
      t: {$gte: startTimestamp}
    }
  }, {
    $sort: {
      t: 1
    }
  }, {
    $group: {
      _id: {
        year: {$year: {$add: [new Date(0), "$t"]}}, 
        month: {$month: {$add: [new Date(0), "$t"]}}, 
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}},
        id: "$id",
        cid: "$cid",
        sid: "$sid"
      }
    }
  }, {
    $group: {
      _id: {
        year: "$_id.year", 
        month: "$_id.month", 
        dayOfMonth: "$_id.dayOfMonth",
        id: "$_id.id",
      },
      count: {$sum: 1},
    }
  }, {
    $addFields: {
      year:"$_id.year",
      month:"$_id.month",
      dayOfMonth:"$_id.dayOfMonth",
      documentId:"$_id.id",
    }
  }] 

  
  const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline, {
    allowDiskUse: true
  });

  const bulk = wapper.getUnorderedBulkOp(TB_STAT_PAGEVIEW_DAILY);
  resultList.forEach((item)=>{
    const statDate = new Date(Date.UTC(item.year, item.month-1, item.dayOfMonth));
    item.created = Date.now();
    item.statDate = statDate;
    bulk.find(item._id).upsert().updateOne(item);
  });

  console.log("total query result count", resultList.length);
  console.log("bulk ops", bulk.tojson());
  const result = await wapper.execute(bulk);
  //console.log("10 list", resultList.slice(0, 73), "....");
  console.log("bulk result", result);
  wapper.close();
  return (null, resultList);
};
