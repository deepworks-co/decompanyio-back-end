const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const DocumentFeaturedSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    latestVoteAmount: {
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
    
}, {collection: "DOCUMENT-FEATURED"});

DocumentFeaturedSchema.index({latestVoteAmount: -1, created: -1})
DocumentFeaturedSchema.index({tags: 1, accountId: 1, latestVoteAmount: -1, created: -1})
DocumentFeaturedSchema.index({tags: 1, latestVoteAmount: -1, created: -1 })
DocumentFeaturedSchema.index({accountId: 1, latestVoteAmount: -1, created: -1 })



module.exports = mongoose.models.DocumentFeatured || mongoose.model('DocumentFeatured', DocumentFeaturedSchema);