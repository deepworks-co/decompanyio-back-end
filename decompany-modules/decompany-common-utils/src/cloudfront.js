var AWS = require("aws-sdk");


/**
 * @param regions : 
 * @param streamName : 
 * @param PartitionKey :
 * @param body :
 */
exports.createInvalidation = (region, params) => {
    
    const cloudfront = new AWS.CloudFront({region: region});

    return new Promise((resolve, reject) =>{
       
          cloudfront.createInvalidation(params, function(err, data) {
            if (err) reject(err);
            else     resolve(data);
          });
    });

    
 }