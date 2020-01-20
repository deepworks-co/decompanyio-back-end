const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RewardPoolSchema = new Schema({
    _id: {
        start: {type: Date},
        end: {type: Date},
    },
    reward: {
      type: Number
    },
    creatorReward: {
      type: Number
    },
    curatorReward: {
      type: Number
    },
    creatorDailyReward: {
        type: Number
    },
    curatorDailyReward: {
      type: Number
    },
}, { collection: "REWARD-POOL"});

RewardPoolSchema.index({"_id.start": 1, "_id.end": 1})

module.exports = mongoose.models.RewardPoolSchema || mongoose.model('RewardPoolSchema', RewardPoolSchema);