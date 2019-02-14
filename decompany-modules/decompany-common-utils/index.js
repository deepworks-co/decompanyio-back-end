const utils = require('./src/utils');
const s3Utils = require('./src/s3Utils');
const mongoWapper = require('./src/MongoWapper');
const firehose = require('./src/kinesisFirehose');

module.exports = utils;
module.exports.s3 = s3Utils;
module.exports.MongoWapper = mongoWapper;
module.exports.firehose = firehose;