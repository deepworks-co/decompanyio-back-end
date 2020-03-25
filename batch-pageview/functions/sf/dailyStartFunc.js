'use strict';
const {utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {

  // yesterday
  const startDate = utils.getDate(new Date(), -1);// new Date(now - 1000 * 60 * 60 * 24 * 10);
  
  const startTimestamp = utils.getBlockchainTimestamp(startDate);
  const endTimestamp = utils.getBlockchainTimestamp(new Date());
  
  return {
    success: true, 
    start: startTimestamp,
    end: endTimestamp
  }
};
