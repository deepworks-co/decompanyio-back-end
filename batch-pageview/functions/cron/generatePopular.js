'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

const TB_TRACKING = tables.TRACKING;
const TB_PAGEVIEW_LATEST = tables.PAGEVIEW_LATEST;
const TB_DOCUMENT = tables.DOCUMENT;
const TB_DOCUMENT_POPULAR = tables.DOCUMENT_POPULAR;

const period = 7; //days
/**
 * @description 
 * PAGEVIEW-LATEST를 1시간 마다 갱신함
 * PAGEVIEW-LATEST, DOCUMENT를 이용하여 DOCUMENT-POPULAR를 갱신함
 * DOCUMENT-POPULAR은 popular 정렬 조건에 사용됨
 */
module.exports.handler = async (event, context, callback) => {
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const now = new Date();
    const beforeDays = new Date(now - 1000 * 60 * 60 * 24 * period);
    console.log("period :", period);
    console.log("Query period", beforeDays, "(include) between (exclude)", now);

    const queryPipeline = getQueryPipeline(beforeDays.getTime());

    const resultList = await wapper.aggregate(TB_TRACKING, queryPipeline, {
      allowDiskUse: true
    });
    console.log(resultList);
    console.log("pageview aggregation success count ", resultList.length);

    return "success";

  } catch(e) {
    console.error("generatePopular error!!!", e);
  } finally {
    wapper.close();
  }
  
  
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
    $addFields: {
      latestViewDate: {$add: [new Date(0), "$timestamp"]},
      document: { $arrayElemAt: [ "$documentAs", 0 ] },
    }
  }, {
    $match: {
      document: { $exists: true, $ne: null }
    }
  }, {
    $addFields:{
      tags: "$document.tags",
      documentName: "$document.documentName",
      seoTitle: "$document.seoTitle",
      accountId: "$document.accountId",
      title: "$document.title",
      desc: "$document.desc",
      created: "$document.created",
      state: "$document.state",
      totalPages: "$document.totalPages"
    }
  }, {
    $project: {
      document: 0,
      documentAs: 0
    }
  }, {
    $out: TB_DOCUMENT_POPULAR
  }] 

  return queryPipeline;
}
