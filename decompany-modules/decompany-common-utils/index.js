const utils = require('./src/utils');
const s3Utils = require('./src/s3Utils');
const mongoWapper = require('./src/MongoWapper');
const firehose = require('./src/kinesisFirehose');
const kinesis = require('./src/kinesis');
const sqs = require('./src/sqs');
const contractWapper = require('./src/ContractWapper');


module.exports = utils;
module.exports.utils = utils;
module.exports.s3 = s3Utils;
module.exports.MongoWapper = mongoWapper;
module.exports.firehose = firehose;
module.exports.kinesis = kinesis;
module.exports.sqs = sqs;
module.exports.ContractWapper = contractWapper;