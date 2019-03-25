'use strict';
const documentService = require('../document/documentMongoDB');
const {utils} = require('decompany-common-utils');

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

/**
 * @description voted documets
 * @url : /api/curator/document/list
 */
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const {body} = event;
  const pageNo = (isNaN(body.pageNo) || body.pageNo<1)?1:Number(body.pageNo);
  const accountId = body.accountId;
  const tag = body.tag;

  const promise1 = documentService.queryVotedDocumentByCurator({
    pageNo: pageNo,
    applicant: accountId,
    tag: tag
  })

  const date = utils.getBlockchainTimestamp(new Date());    //utc today
  console.log(date);
  const promise2 = documentService.queryTotalViewCountByToday(date);

  const results = await Promise.all([promise1, promise2]);
  
  console.log("success!!", JSON.stringify(results));
  const result = results[0];
  const resultList = result.resultList?result.resultList:[];
  const totalViewCountInfo = results[1]


  return callback(null, JSON.stringify({
    success: true,
    resultList: resultList,
    count: resultList.length,
    totalViewCountInfo: totalViewCountInfo
  }));
  
  
  
};