'use strict';

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
    const tomorrow = new Date(now.getTime() + 1000 * 60 * 60 * 24);
    const start = utils.getBlockchainTimestamp(now);
    const end = utils.getBlockchainTimestamp(tomorrow);
    console.log(`${now} ~ ${tomorrow}`);
    const queryPipeline = getTodayTotalPageview(start, end);
    console.log(JSON.stringify(queryPipeline));
    const resultList = await wapper.aggregate(TB_DOCUMENT_POPULAR, queryPipeline);
    console.log(resultList[0]);
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



function getTodayTotalPageview(start, end){

  const queryPipeline = [{
    $match: {
      timestamp: {$gte: start, $lt: end}
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