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
  const {accountId, tag, path} = body;
  
  const today = new Date();
  const blockchainTimestamp = utils.getBlockchainTimestamp(today);

  const promise1 = documentService.queryVotedDocumentByCurator({
    applicant: accountId,
    startTimestamp: blockchainTimestamp
  });

  const promise2 = documentService.queryTotalViewCountByToday(blockchainTimestamp);

  const results = await Promise.all([promise1, promise2]);
  
  console.log("curatorTodayDocumentList succeeded.\r\n", results);
  const resultList = results[0].resultList;
  const data2 = results[1];

  callback(null, JSON.stringify({
    success: true,
    todayVotedDocuments: resultList,
    totalViewCount: data2?data2:[]
  }));

  
  
  
};