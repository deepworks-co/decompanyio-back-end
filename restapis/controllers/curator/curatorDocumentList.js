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
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  const {query} = event;
  const pageNo = (isNaN(query.pageNo) || query.pageNo<1)?1:Number(query.pageNo);
  const ethAccount = query.ethAccount;
  const tag = query.tag;
  const pageSize = isNaN(query.pageSize)?20:Number(query.pageSize);

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
  const promise2 = documentService.getRecentlyPageViewTotalCount();

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