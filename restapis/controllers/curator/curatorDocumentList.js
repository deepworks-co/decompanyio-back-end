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
  
  const {query} = event;
  const pageNo = (isNaN(query.pageNo) || query.pageNo<1)?1:Number(query.pageNo);
  const ethAccount = query.ethAccount;
  const tag = query.tag;
  const pageSize = query.pageSize?query.pageSize:20;

  if(!ethAccount){
    throw new Error(`parameter is invalid!! ${JSON.stringify(query)}`);
  }

  const promise1 = documentService.queryVotedDocumentByCurator({
    pageNo: pageNo,
    pageSize: pageSize,
    applicant: ethAccount,
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


  return JSON.stringify({
    success: true,
    resultList: resultList,
    count: resultList.length,
    pageNo: pageNo,
    totalViewCountInfo: totalViewCountInfo
  });
  
  
  
};