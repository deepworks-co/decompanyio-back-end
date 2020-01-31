const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VWDailyPageviewSchema = new Schema({
    _id: {
      year: {type: Number},
      month: {type: Number},
      dayOfMonth: {type: Number},
      id: {type: String},
    },
    documentId: {
        type: String,
        ref: "Document",
        required: true
    },
    blockchainTimestamp: {
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
}, { collection: "VW-DAILY-PAGEVIEW" });

module.exports = mongoose.models.VWDailyPageviewSchema || mongoose.model('VWDailyPageviewSchema', VWDailyPageviewSchema);