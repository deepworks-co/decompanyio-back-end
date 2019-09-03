const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const DocumentPopluarSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    latestPageview: {
        type: Number,
        required: true
    },
    latestVoteAmountDate:{
        type: Date
    },
    created: {
        type: Number,
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    tags: [String],
    documentId: {
        type: String
    },
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    seoTitle: {
        type: String,
        required: true,
        unique: true
    },
    
}, {collection: "DOCUMENT-POPULAR"});

DocumentPopluarSchema.index({latestPageview: -1, created: -1 })
DocumentPopluarSchema.index({tags: 1, accountId: 1, latestPageview: -1, created: -1})
DocumentPopluarSchema.index({tags: 1, latestPageview: -1, created: -1 })
DocumentPopluarSchema.index({accountId: 1, latestPageview: -1, created: -1})



module.exports = mongoose.models.DocumentPopular || mongoose.model('DocumentPopular', DocumentPopluarSchema);