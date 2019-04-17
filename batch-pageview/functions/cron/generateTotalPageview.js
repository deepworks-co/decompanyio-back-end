'use strict';

'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

const TB_TRACKING = tables.TRACKING;

/**
 * @description 
 * 오늘의 현재시간까지(UTC기준) STAT-PAGEVIEW-TOTALCOUNT-DAILY 항목을 저장한다.
 */
module.exports.handler = async (event, context, callback) => {
  const wapper = new MongoWapper(mongodb.endpoint);

  try{
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const start = utils.getBlockchainTimestamp(now);
    const end = utils.getBlockchainTimestamp(tomorrow);
    console.log(`${now} ~ ${tomorrow}`);
    //const queryPipeline = getTodayTotalPageview(start, end);
    const queryPipeline = getQueryPipeline(start, end);
    console.log(JSON.stringify(queryPipeline));
    const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline);
    console.log(resultList[0]);
    /*
    { _id: { year: 2019, month: 4, dayOfMonth: 17 },
      totalPageview: 4,
      totalPageviewSquare: 6,
      count: 3 
    }
    */
    const item = resultList[0];
    item.created = now.getTime();
    item.blockchainTimestamp = start;
    item.blockchainDate = new Date(start);
    const saveResult = await wapper.save(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY, item);
    console.log("save result", saveResult);
    
    return "success"; 

  } catch(e) {
    console.error("generatePopular error!!!", e);
  } finally {
    wapper.close();
  }

};

function getQueryPipeline(start, end){
  const queryPipeline = [{
    $match: {
      t: {$gte: start, $lt: end},
      n: {$gt: 1}
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
      },
      timestamp: {$max: "$t"}
    }
  }, {
    $group: {
      _id: "$_id.id",
      latestPageview: {$sum: 1},
      timestamp: {$max: "$timestamp"}
    }
  }, {
    $lookup: {
      from: "DOCUMENT",
        foreignField: "_id",
        localField: "_id",
        as: "documentAs"
    }
  }, {
    $unwind: {
      path: "$documentAs",
      "preserveNullAndEmptyArrays": true
    }
  }, {
    "$match": {
      "documentAs": { "$exists": true, "$ne": null }
    }
  }, {
    $group: {
      _id: {
        year: {$year: {$add: [new Date(0), "$timestamp"]}}, 
        month: {$month: {$add: [new Date(0), "$timestamp"]}}, 
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$timestamp"]}}, 
        
      },
      totalPageview: {$sum: "$latestPageview"},
      totalPageviewSquare: {$sum: {$pow: ["$latestPageview", 2]}},
      count: {$sum: 1}
    }
  }] 

  return queryPipeline;
}