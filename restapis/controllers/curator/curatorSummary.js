'use strict';
const documentService = require('../document/documentMongoDB');
const {utils} = require('decompany-common-utils');
const { applicationConfig } = require('../../resources/config.js').APP_PROPERTIES();
const period = applicationConfig.activeVoteDays;
/**
 * @description recently voted documets
 * @url : /api/curator/document/today
 */
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const {query} = event;
  const {ethAccount} = query;
  
  const today = new Date();
  const startDate = new Date(today.getTime() - 1000 * 60 * 60 * 24 * period);
  const blockchainTimestamp = utils.getBlockchainTimestamp(startDate);

  const resultList = await documentService.queryRecentlyVoteListForApplicant({
    applicant: ethAccount,
    startTimestamp: blockchainTimestamp
  });

  const user = await documentService.getUser({ethAccount: ethAccount});
  const pageSize = 10000;
  const voteDocList = await documentService.getVotedDocumentForAccountId(user._id);

  const totalViewCountInfo = await documentService.getRecentlyPageViewTotalCount();

  return JSON.stringify({
    success: true,
    resultList: resultList,
    voteDocList: voteDocList,
    totalViewCountInfo: totalViewCountInfo
  });
  
};