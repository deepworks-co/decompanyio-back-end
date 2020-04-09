'use strict';
const {VWDailyVote, VWDailyPageview, RewardPool} = require('decompany-mongoose').models
const {utils} = require('decompany-common-utils');
const {applicationConfig} = require('decompany-app-properties');
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;
const Web3Utils = require('web3-utils');
const BigNumber = require('bignumber.js');
const { calcCuratorReward } = require('./CuratorService')
module.exports = async ({userId, documentId}) => {

  if(!userId || !documentId){
    throw new Error("parameter is not vaild")
  }

  const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
  const startDate = utils.getDate(nowDate, -1 * (ACTIVE_VOTE_DAYS - 1)); 
  const endDate = utils.getDate(nowDate, 1);  //exclude


  console.log('start, end', startDate, endDate)
  return calcCuratorReward({ startDate, endDate, userId, documentId })
}
