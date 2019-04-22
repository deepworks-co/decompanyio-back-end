'use strict';
const {utils, MongoWapper} = require('decompany-common-utils');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();

const TB_STAT_PAGEVIEW_DAILY = tables.STAT_PAGEVIEW_DAILY;
const TB_DOCUMENT_POPULAR = tables.DOCUMENT_POPULAR;

const period = 7; //days
/**
 * @description 
 * 5분 주기로 DOCUMENT-POPULAR 갱신
 * 현재 + 6일전 (총 7일)의 집계
 */
module.exports.handler = async (event, context, callback) => {
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const now = new Date();
    const beforeDays = new Date(now - 1000 * 60 * 60 * 24 * (period - 1));
    const start = utils.getBlockchainTimestamp(beforeDays);
    console.log("period :", period);
    console.log("Query period", new Date(start), "(include) between (exclude)", now);

    const queryPipeline = getQueryPipeline(new Date(start));

    const resultList = await wapper.aggregate(TB_STAT_PAGEVIEW_DAILY, queryPipeline, {
      allowDiskUse: true
    });
    
    console.log("success pageview aggregation", resultList);

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
function getQueryPipeline(start){
  const queryPipeline = [{
    $match: {
      blockchainDate: {$gte: start}
    }
  }, {
    $group: {
      _id: "$_id.id",
      latestPageview: {$sum: "$pageview"},
      latestPageviewList: {$addToSet: {year:"$_id.year", month: "$_id.month", dayOfMonth:"$_id.dayOfMonth", pv: "$pageview"}},
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
