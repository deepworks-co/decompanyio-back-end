'use strict';
const {VWDailyVote, VWDailyPageview, RewardPool, ClaimReward} = require('decompany-mongoose').models
const { utils } = require('decompany-common-utils');
const { applicationConfig } = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;

const { calcCuratorReward } = require('./CuratorService')
module.exports = async ({userId, documentId}) => {

  if(!userId || !documentId){
    throw new Error("parameter is not vaild")
  }

  const lastClaim = await ClaimReward.find({
    "_id.userId": userId,
    "_id.documentId": documentId,
  }).sort({_id: -1}).limit(1);

  const LAST_CLAIM = lastClaim[0] ? utils.getDate(lastClaim[0].voteDate, 1) : 0;
  console.log("LAST_CLAIM", LAST_CLAIM)

  const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
  const startDate = new Date(utils.getBlockchainTimestamp(new Date(LAST_CLAIM)))
  const endDate = utils.getDate(new Date(), -1 * (ACTIVE_VOTE_DAYS - 1));
  
  console.log('start, end', startDate, endDate)
  return calcCuratorReward({ startDate, endDate, userId, documentId })
}