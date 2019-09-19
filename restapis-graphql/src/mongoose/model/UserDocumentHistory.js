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
    }
}, { collection: "USER-DOCUMENT-HISTORY"});

UserDocumentHistorySchema.index({userId: 1, created: -1})
UserDocumentHistorySchema.index({userId: 1, documentId: 1, created: -1})

module.exports = mongoose.models.UserDocumentHistory || mongoose.model('UserDocumentHistory', UserDocumentHistorySchema);