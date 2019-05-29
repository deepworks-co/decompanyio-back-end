'use strict';
const { s3Config } = require('decompany-app-properties');
const sharp = require("sharp");

var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-1"
});
const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  const result = await run(event);

  return callback(null, result);

};

async function run(event){
  console.log(JSON.stringify(event));
  const promises = await event.Records.map((record) =>  {
    const key = record.s3.object.key;
    const bucket = record.s3.bucket.name;
    
    console.log("profile image converter start", bucket, key);

    const size = 320;

    return convertJpeg({fromBucket: bucket, fromPrefix: key}, {toBucket: s3Config.upload_profile, toPrefix: key}, size);

  });
  

  const result = await Promise.all(promises);

  return result;
}

async function convertJpeg(from, to, size){
  const {fromBucket, fromPrefix} = from;
  const {toBucket, toPrefix} = to;
  console.log({from, to});

  const input = await getS3ObjectBody(fromBucket, fromPrefix);
  //console.log(input);
  const output = await sharp(input)
  .resize(size, size, {
    fit: sharp.fit.inside,
    withoutEnlargement: true
  })
  .jpeg({
    quality: 80
  })
  .toBuffer();

  await putS3Object(toBucket, toPrefix, output, "image/jpeg");

  const webpOutput = await sharp(input)
  .resize(size, size, {
    fit: sharp.fit.inside,
    withoutEnlargement: true
  })
  .webp({
    quality: 95
  })
  .toBuffer();


  return await putS3Object(toBucket, toPrefix, webpOutput, "image/webp");
}


function getS3ObjectBody(bucket, key){
  
  return new Promise((resolve, reject)=>{
    s3.getObject({
      Bucket: bucket, 
      Key: key
     }, function(err, data) {
       if (err) reject(err); // an error occurred
       else {
         resolve(data.Body);           // successful response
       }
  
     });
  })
  
}

function putS3Object(bucket, key, body, contentType){
  return new Promise((resolve, reject)=>{
    s3.putObject({
      Body: body, 
      Bucket: bucket, 
      Key: key, 
      Metadata: {
        "Cache-Control": "max-age=31536000" 
      },
      ContentType: contentType
     }, function(err, data) {
       if (err) {
         
         reject(err); // an error occurred
       } else {
          console.log("putS3Object success", bucket, key);
          resolve(data.body);           // successful response
       }
  
     });
  })
  
}
