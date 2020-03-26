'use strict';
const {utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {

  const endDate = utils.getDate(new Date(), 1);// new Date(now - 1000 * 60 * 60 * 24 * 10);
  
  const start = utils.getBlockchainTimestamp(new Date());
  const end = utils.getBlockchainTimestamp(endDate);
  
  return {
    success: true, 
    start,
    end
  }
};
