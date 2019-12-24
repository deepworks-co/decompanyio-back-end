const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VWDailyVoteSchema = new Schema({
    _id: {
      blockchainTimestamp: {type: Number},
      userId: {type: String},
      documentId: {type: String},
    },
    userId: {
      type: String
    },
    documentId: {
        type: String,
    },
    blockchainTimestamp: {
      type: Number
    },
    totalDeposit: {
      type: Number
    },
    pageview: {
      type: Number
    },
    totalPageview: {
      type: Number
    },
    totalPageviewSquare: {
      type: Number
    }
}, { collection: "VW-DAILY-VOTE" });

module.exports = mongoose.models.VWDailyVoteSchema || mongoose.model('VWDailyVoteSchema', VWDailyVoteSchema);