'use strict';
const { s3Config } = require('decompany-app-properties');

module.exports.s3Config = (serverless) => {
    return s3Config;
}