const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ClaimReward = new Schema({
  _id: {
    year: {type: Number},
    month: {type: Number},
    dayOfMonth: {type: Number},
    userId: {type: String},
    documentId: {type: String},
  },
  blockchainTimestamp: {
    type: Number
  },
  value: {
    type: Number
  },
  created: {
    type: Number
  }
}, {collection: "CLAIM-REWARD"});

ClaimReward.index({blockchainTimestamp: 1});
ClaimReward.index({"_id.userId": 1, "_id.documentId": 1});


module.exports = mongoose.models.ClaimReward || mongoose.model('ClaimReward', ClaimReward);