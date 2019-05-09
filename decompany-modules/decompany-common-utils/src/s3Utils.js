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

 exports.signedDownloadUrl = (regions, bucketname, key, signedUrlExpireSeconds) => {

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

 exports.putObject = (bucket, key, text, attr, regions) =>{
    AWS.config.update({
        region: regions?regions:"us-west-1"
    });
    
    const s3 = new AWS.S3();

    
    let source = {
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(text, 'binary')
    };
    let sendParams = {}

    if(typeof(attr) === 'string'  ){
        sendParams = Object.assign(source, {ContentType: attr});
    } else if(typeof(attr) === 'object'  ){
        sendParams = Object.assign(source, attr);
    }
    
    return s3.putObject(sendParams).promise();
 }

 exports.putObjectAndExpries = (bucket, key, text, contentType, regions, expires) =>{
    AWS.config.update({
        region: regions?regions:"us-west-1"
    });
    
    var s3 = new AWS.S3();
    
    return s3.putObject({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        Expires: expires,
        Body: Buffer.from(text, 'binary')
    }).promise();
 }

 exports.getObject = (bucket, key, region) =>{
    AWS.config.update({
        region: region?region:"us-west-1"
    });
    
    const s3 = new AWS.S3();
    
    return new Promise((resolve, reject) => {
        s3.getObject({
            Bucket: bucket,
            Key: key
        }, (err, data)=>{
            if(err) reject(err);
            else resolve(data);
        })
    });
 }