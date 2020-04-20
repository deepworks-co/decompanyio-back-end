// ./models/User.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    created: {
        type: Number
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    picture: {
        type: String
    },
    local: {
        type: String
    },
    nickname: {
        type: String
    },
    family_name: {
        type: String
    },
    ethAccount: {
        type: String
    } 
}, {collection: "USER"});

UserSchema.index({username: 1}, {unique: true});
UserSchema.index({email: 1});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);