'use strict';
const { s3Config } = require('decompany-app-properties');
const sharp = require("sharp");
const AWS = require("aws-sdk");
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
  const promises = event.Records.map((record) =>  {
    const key = decodeURI(record.s3.object.key);
    const imageSize = record.s3.object.size;
    const bucket = record.s3.bucket.name;
    
    console.log("profile image converter start", bucket, key);

    const size = 320;

    return convertJpeg({fromBucket: bucket, fromPrefix: key}, {toBucket: "alpha-ca-profile", toPrefix: key}, size);

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

  return await putS3Object(toBucket, toPrefix, output, "image/jpeg");
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
