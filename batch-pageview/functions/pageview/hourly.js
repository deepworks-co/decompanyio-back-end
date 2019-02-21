'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

const TB_TRACKING = tables.TRACKING;
const TB_PAGEVIEW = tables.PAGEVIEW;

module.exports.handler = async (event, context, callback) => {
  const now = new Date();
  const beforeThreeDaysAgo = new Date(now - 1000 * 60 * 60 * 24 * 3);

  console.log("QUERY TIME", beforeThreeDaysAgo, "(include) between (exclude)", now);

  const queryPipeline = getQueryPipeline(beforeThreeDaysAgo.getTime());

  const wapper = new MongoWapper(mongodb.endpoint);
  const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline, {
    allowDiskUse: true
  });


  console.log("aggregation success", resultList);

  const promises = [];
  resultList.forEach((item, index) => {
    item.created = now.getTime();
    item.expireAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);//3일뒤 expired
    promises.push(wapper.save(TB_PAGEVIEW, item), null, true);
  });
  
  

  const result = await Promise.all(promises);
  console.log("success", result);
  wapper.close();
  return (null, "success");
};

/**
 * @description
 * 일정 (startTimestamp보다 크거나 같고 endTimestamp작은) 기간동안의 document pageview를 조회하기 위한 aggregate query pipeline 생성
 * DOCUMENT-TRACKING collection을 대상으로 한다.
 * @param  {} startTimestamp
 * @param  {} endTimestamp
 */
function getQueryPipeline(startTimestamp){
  const queryPipeline = [{
    $match: {
      t: {$gte: startTimestamp},
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
      pageview: {$sum: 1}
    }
  }, {
    $group: {
      _id: {
        id: "$_id.id"
      },
      totalPageview: {$sum: "$pageview"}
    }
  },
  {
    $addFields: {
      documentId: "$_id.id"
    }
  }
  ] 

  return queryPipeline;
}