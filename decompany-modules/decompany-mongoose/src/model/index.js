const Document = require('./Document');
const DocumentFeatured = require('./DocumentFeatured');
const DocumentPopular = require('./DocumentPopular');
const User = require('./User');
const UserDocumentFavorite = require('./UserDocumentFavorite');
const UserDocumentHistory = require('./UserDocumentHistory');
const VWDailyPageview = require('./VWDailyPageview');
const VWDailyVote = require('./VWDailyVote');
const RewardPool = require('./RewardPool');
const ClaimReward = require('./ClaimReward');
const ClaimRoyalty = require('./ClaimRoyalty');
const Vote = require('./Vote');

module.exports = {
    Document,
    DocumentFeatured,
    DocumentPopular,
    User,
    UserDocumentFavorite,
    UserDocumentHistory,
    VWDailyPageview,
    VWDailyVote,
    RewardPool,
    ClaimReward,
    ClaimRoyalty,
    Vote
}