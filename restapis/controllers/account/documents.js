'use strict';
const AccountService = require('./AccountService');
const documentService = require('../document/documentMongoDB');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event", JSON.stringify(event));

  const {query, principalId} = event;

  console.log("query", query);
  
  const pageNo = isNaN(query.pageNo)?1:Number(query.pageNo);
  const pageSize = isNaN(query.pageSize)?10:Number(query.pageSize);
  const skip = ((pageNo - 1) * pageSize);

  const totalViewCountInfo = await documentService.getRecentlyPageViewTotalCount();
  
  const accountService = new AccountService();
  const resultMap = await accountService.getDocuments({
    accountId: principalId,
    pageSize: pageSize,
    skip: skip
  });
  
  return JSON.stringify({
    success: true,
    resultList: resultMap.resultList,
    pageNo: pageNo,
    count: resultMap.totalCount,
    totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
  });
};
