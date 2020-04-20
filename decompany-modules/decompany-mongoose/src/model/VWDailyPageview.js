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
    blockchainDate: {
      type: Date
    },
    pageview: {
      type: Number
    },
    userId: {
      type: String
    },
    totalPageview: {
      type: Number
    },
    totalPageviewSquare: {
      type: Number
    },
    created: {
      type: Number
    },
    createdAt: {
      type: Date
    }
}, { collection: "VW-DAILY-PAGEVIEW" });

module.exports = mongoose.models.VWDailyPageviewSchema || mongoose.model('VWDailyPageviewSchema', VWDailyPageviewSchema);