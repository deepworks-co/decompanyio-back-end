const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ClaimRoyalty = new Schema({
  _id: {
    documentId: {type: String},
    userId: {type: String},
    blockchainTimestamp: { type: Number }
  },
  value: {
    type: Number
  },
  created: {
    type: Number
  }
}, {collection: "CLAIM-REWARD"});

ClaimRoyalty.index({"_id.userId": 1, "_id.documentId": 1, "_id.blockchainTimestamp": -1});
ClaimRoyalty.index({"_id.blockchainTimestamp": -1});


module.exports = mongoose.models.ClaimRoyalty || mongoose.model('ClaimRoyalty', ClaimRoyalty);