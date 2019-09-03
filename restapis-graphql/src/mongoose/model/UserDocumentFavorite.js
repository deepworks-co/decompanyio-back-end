const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserDocumentFavoriteSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    documentId: {
        type: String,
        ref: "Document"
    },
    created: {
        type: Number,
        default: Date.now
    },
    
}, {collection: "USER-DOCUMENT-FAVORITE"});

UserDocumentFavoriteSchema.index({userId: 1, created: -1})
UserDocumentFavoriteSchema.index({userId: 1, documentId: 1}, {unique: true})

module.exports = mongoose.models.UserDocumentFavorite || mongoose.model('UserDocumentFavorite', UserDocumentFavoriteSchema);

