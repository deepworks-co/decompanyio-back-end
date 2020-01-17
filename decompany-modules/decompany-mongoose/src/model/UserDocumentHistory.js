const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserDocumentHistorySchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    documentId: {
        type: String,
        ref: "Document",
        required: true
    },
    created: {
        type: Number,
        default: Date.now
    },
    updated: {
        type: Number,
        default: Date.now
    },
    refs: {
        type: Number,
        default: 1
    }
}, { collection: "USER-DOCUMENT-HISTORY"});

UserDocumentHistorySchema.index({userId: 1, created: -1})
UserDocumentHistorySchema.index({userId: 1, updated: -1})
UserDocumentHistorySchema.index({userId: 1, documentId: 1}, {unique: true})

module.exports = mongoose.models.UserDocumentHistory || mongoose.model('UserDocumentHistory', UserDocumentHistorySchema);