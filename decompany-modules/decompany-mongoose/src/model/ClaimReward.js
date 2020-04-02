const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ClaimReward = new Schema({
  _id: {
    userId: {type: String},
    documentId: {type: String},
    blockchainTimestamp: {type: Number}
  },
  curatorReward: {
    type: Array
  },
  voteDate: {
    type: Date
  },
  voteAmount: {
    type: Number
  },
  totalReward: {
    type: Number
  },
  created: {
    type: Number
  }
}, {collection: "CLAIM-REWARD"});

ClaimReward.index({"_id.userId": 1, "_id.documentId": 1, "_id.blockchainTimestamp": -1});
ClaimReward.index({"_id.blockchainTimestamp": -1});


module.exports = mongoose.models.ClaimReward || mongoose.model('ClaimReward', ClaimReward);