var AWS = require("aws-sdk");

/**
 * @param regions : default us-west-1
 * @param buckname : 
 * @param key
 * @param signedUrlExpireSeconds default : (5 min)
 */
exports.signedUploadUrl = (regions, bucketname, key, signedUrlExpireSeconds) => {

    AWS.config.update({
        region: regions?regions:"us-west-1"
    });
    
    var s3 = new AWS.S3();
    
    const url = s3.getSignedUrl('getObject', {
        Bucket: bucketname,
        Key: key,
        Expires: signedUrlExpireSeconds?signedUrlExpireSeconds:(60 * 5)
    });

    return url;
 }