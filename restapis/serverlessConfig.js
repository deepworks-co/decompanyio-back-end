'use strict';

module.exports.s3Config = (serverless) => {
    const stage = serverless.processedInput.options.stage;

    if(stage){
        process.env.stage = stage;
    }
    
    const { s3Config } = require('decompany-app-properties');    
    console.log('input stage', stage);
    console.log('s3Config', JSON.stringify(s3Config));
    return s3Config;
}