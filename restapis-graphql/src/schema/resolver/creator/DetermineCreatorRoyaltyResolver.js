'use strict';

const {utils} = require('decompany-common-utils');
const {applicationConfig} = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;
const { calcCreatorRoyalty } = require('./CreatorService')

module.exports = async ({documentId}) => {
  if(!documentId){
    throw new Error("parameter is not vaild")
  }

  const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
  const startDate = utils.getDate(nowDate, -1 * (ACTIVE_VOTE_DAYS - 1)); 
  const endDate = utils.getDate(nowDate, 1);

  console.log(`${startDate} <= ... < ${endDate}`)
  return calcCreatorRoyalty({documentId, startDate, endDate})
}