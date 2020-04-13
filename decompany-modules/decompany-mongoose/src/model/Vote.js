// ./models/User.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const VoteSchema = new Schema({
    documentId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    deposit: {
        type: mongoose.Types.Decimal128,
        required: true
    },
    blockchainTimestamp: {
        type: Number,
        required: true
    },
    created: {
        type: Number,
        required: true
    },
}, {collection: "VOTE"});

VoteSchema.index({documentId: 1, userId: 1, created: -1});

module.exports = mongoose.models.Vote || mongoose.model('Vote', VoteSchema);