'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

const TB_TRACKING = tables.TRACKING;
const TB_PAGEVIEW_LATEST = tables.PAGEVIEW_LATEST;
const TB_DOCUMENT = tables.DOCUMENT;
const TB_DOCUMENT_POPULAR = tables.DOCUMENT_POPULAR;

const period = 7; //days

module.exports.handler = async (event, context, callback) => {
  const now = new Date();
  const beforeDays = new Date(now - 1000 * 60 * 60 * 24 * period);
  
  console.log("QUERY TIME", beforeDays, "(include) between (exclude)", now);

  const queryPipeline = getQueryPipeline(beforeDays.getTime());

  const wapper = new MongoWapper(mongodb.endpoint);
  const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline, {
    allowDiskUse: true
  });

  console.log("pageview aggregation success count ", resultList.length);
  const bulk = wapper.getUnorderedBulkOp(TB_PAGEVIEW_LATEST);
  const promises = [];
  resultList.forEach((item, index) => {
    
    item.created = now.getTime();
    const occurrenceTimestamp = item.occurrenceDate.getTime();
    item.expireAt = new Date(occurrenceTimestamp + 1000 * 60 * 60 * 24 * period); //period 후 expire
    //console.log(item);
    //PAGEVIEW 임시테이블에 기록 period이후 소멸됨
    bulk.find({_id: item._id}).upsert().updateOne(item);
   
  });
  const result = await wapper.execute(bulk);
  //const result = await Promise.all(promises);
  console.log("bulk complete", result);

  const popularResult = await wapper.aggregate(TB_DOCUMENT, makePopularPipeline(), { allowDiskUse: true });

  console.log("make DOCUMENT-POPULAR collection success", popularResult);

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
      pageview: {$sum: 1},
      timestamp: {$max: "$t"}
    }
  }, {
    $group: {
      _id: "$_id.id",
      totalPageview: {$sum: "$pageview"},
      timestamp: {$max: "$timestamp"}
    }
  }, {
    $addFields: {
      occurrenceDate: {$add: [new Date(0), "$timestamp"]}
    }
  }, {
    $project: {
      occurrenceDate: 1,
      totalPageview: 1,
    }
  }] 

  return queryPipeline;
}

function makePopularPipeline(){

  const pipeline = [   
  {
    $match: {
        state: "CONVERT_COMPLETE"
    }
  }, {
    $lookup: {
        from: "PAGEVIEW-LATEST",
        foreignField: "_id",
        localField: "_id",
        as: "latestPageviewAs"
    }
  }, {
    $project: {title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: { $arrayElemAt: [ "$latestPageviewAs", 0 ] }}
  }, {
    $project: {title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: {$ifNull: ["$latestPageview.totalPageview", 0]}}
  }, {
    $out: TB_DOCUMENT_POPULAR
  }]

  return pipeline;
}

