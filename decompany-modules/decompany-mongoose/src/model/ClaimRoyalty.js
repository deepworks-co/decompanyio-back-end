const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ClaimRoyalty = new Schema({
  _id: {
    userId: {type: String},
    documentId: {type: String},
    blockchainTimestamp: { type: Number }
  },
  value: {
    type: Number
  },
  created: {
    type: Number
  }
}, {collection: "CLAIM-ROYALTY"});

ClaimRoyalty.index({"_id.userId": 1, "_id.documentId": 1, "_id.blockchainTimestamp": -1});
ClaimRoyalty.index({"_id.blockchainTimestamp": -1});


module.exports = mongoose.models.ClaimRoyalty || mongoose.model('ClaimRoyalty', ClaimRoyalty);