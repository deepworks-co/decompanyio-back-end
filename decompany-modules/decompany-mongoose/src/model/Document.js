const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const dimensionsSchema = new mongoose.Schema({
    width: Number,
    height: Number,
    type: String
  });

const DocumentSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    created: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        enum: ["NOT_CONVERT", "UPLOAD_COMPLETE", "CONVERT_COMPLETE", "CONVERT_FAIL"],
        required: true
    },
    accountId: {
        type: String,
        required: true
    },
    documentId: {
        type: String
    },
    documentName: {
        type: String,
        required: true
    },
    documentSize: {
        type: String,
        required: Number
    },
    ethAccount: {
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
    useTracking: {
        type: Boolean
    },
    forceTracking: {
        type: Boolean
    },
    isDownload: {
        type: Boolean
    },
    cc: {
        type: String
    },
    isPublic: {
        type: Boolean
    },
    isBlocked: {
        type: Boolean
    },
    isDeleted: {
        type: Boolean
    },
    dimensions: dimensionsSchema
}, {collection: "DOCUMENT"});

DocumentSchema.index({seoTitle: 1}, {unique: true});
DocumentSchema.index({state: 1, tags: 1, accountId: 1, created: -1})
DocumentSchema.index({state: 1, tags: 1, created: -1})
DocumentSchema.index({state: 1, accountId: 1, created: -1})
DocumentSchema.index({state: 1, created: -1})
DocumentSchema.index({state: 1, isDeleted: 1, isPublic: 1, isBlocked: 1, tags: 1, accountId: 1, created: -1})
DocumentSchema.index({state: 1, isDeleted: 1, isPublic: 1, isBlocked: 1, tags: 1, created: -1})
DocumentSchema.index({state: 1, isDeleted: 1, isPublic: 1, isBlocked: 1, accountId: 1, created: -1})
DocumentSchema.index({state: 1, isDeleted: 1, isPublic: 1, isBlocked: 1, created: -1})

module.exports = mongoose.models.Document || mongoose.model('Document', DocumentSchema);