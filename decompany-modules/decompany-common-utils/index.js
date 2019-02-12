const utils = require('./utils');
const s3Utils = require('./s3Utils');
const mongoWapper = require('./MongoWapper');
const firehose = require('./kinesisFirehose');

module.exports = utils;
module.exports.s3 = s3Utils;
module.exports.MongoWapper = mongoWapper;
module.exports.firehose = firehose;