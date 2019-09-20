'use strict';
const {s3Config, region} = require('decompany-app-properties');
const sharp = require("sharp");
const AWS = require("aws-sdk");
const sizeOf = require('buffer-image-size');

const s3 = new AWS.S3();
const CF_THUMB_BUCKET = "alpha-ca-thumbnail"
const QUALITY = 100;

exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */

  let results;
  try{
    const promises = event.Records.map((record) =>  {
      
      const key = record.s3.object.key;
      const bucket = record.s3.bucket.name;
      
      const keys = key.split("/");
      const prefix = keys[0];
      const documentId = keys[1];
      const filename = keys[2];
      
      return run({
        key: key,
        bucket: bucket,
        prefix: prefix,
        documentId: documentId,
        filename: filename
      });
    });

    results = await Promise.all(promises);
  } catch(err){
    console.log(err);
  }

  console.log(results)
  return callback(null, results);
};

function run(params){
  
  const {key, prefix, bucket, filename, documentId} = params;
  return new Promise((resolve, reject)=>{
    if("result.txt" === filename || "text.json" === filename){
      putFileToOrignBucket({
        bucket: bucket,
        key: key
      }, {
        bucket: "asem-ko-document",
        key: key
      })
    } else if("1200X1200" === filename){
      convertThumbnail(bucket, key, CF_THUMB_BUCKET)
      .then((data)=>{
        console.log("convertThumbnail success", data);
        resolve(data)
      })
      .catch((err)=>{
        console.log("convertThumbnail fail", err);
        reject(err);
      })
      
    } else {
      resolve("not support", params);
    }
  });
}

function convertThumbnail(bucket, key, target){
  const keys = key.split("/");

  return new Promise(async (resolve, reject)=>{
      const r = await changeImageMetadata(bucket, key);
      console.log("changeImageMetadata", r)
      const type = keys[0]; //THUMBNAIL
      const documentId = keys[1]; // ${documentId}
      const sizeType = keys[2]; //1200X1200, 300X300
      const imagename = keys[3];  // 1, 2, 3
      const sizes = ['thumb', 1024, 640, 320, 2048];
      const promises = sizes.map((size)=>{
        const toProfix = documentId + "/" + size + "/" + imagename;
        //return convertJpeg({fromBucket: bucket, fromPrefix: key}, {toBucket: s3Config.thumbnail, toPrefix: toProfix}, size);
        return convertJpeg({fromBucket: bucket, fromPrefix: key}, {toBucket: target, toPrefix: toProfix}, size);
        
      });

      Promise.all(promises).then((data)=>{
        resolve(data);
      })
      .catch((err)=>{
        reject(err);
      })
  })
}
function changeImageMetadata(bucket, key){
  return new Promise((resolve, reject) => {
    s3.copyObject({
      Bucket: bucket,
      Key: key,
      CopySource: bucket + "/" + key,
      ContentType: "image/png",
      MetadataDirective: 'REPLACE'
    }, function(err, data){
      if(err) reject(err);
      else resolve(data);
    });
  })

}

async function convertJpeg(from, to, size){
  const {fromBucket, fromPrefix} = from;
  const {toBucket, toPrefix} = to;
  console.log({from, to});

  const input = await getS3ObjectBody(fromBucket, fromPrefix);
  const dimensions = sizeOf(input);
  //console.log(size, "dimensions", dimensions); 
  let calcsize;
  let new_size = {};
  let output
  if(typeof size === 'number'){
    calcsize = size;
    output = await sharp(input)
    .resize(calcsize, calcsize, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .jpeg({
      quality: QUALITY
    })
    .toBuffer();

  } else {
    console.log("slice", toPrefix.slice(-8));
    if(toPrefix.slice(-8) === "/thumb/1"){
      if(dimensions.width > dimensions.height){
        const ratio = 240 / dimensions.height;
        new_size.width = parseInt(dimensions.width * ratio);
        new_size.height = parseInt(dimensions.height * ratio);
  
        calcsize = new_size.width;
      } else {
        const ratio = 320 / dimensions.width;
        new_size.width = parseInt(dimensions.width * ratio);
        new_size.height = parseInt(dimensions.height * ratio);
  
        calcsize = new_size.height;
      }
      
      const extractSize= {left: (new_size.width/2 - 160), top: (new_size.height/2 - 120), width: 320, height: 239};
      //const extractSize= {left: 0, top: 0, width: 100, height: 100};
      console.log("thumb", "calcsize", calcsize, "new_size", new_size, "extractSize", extractSize);
      output = await sharp(input)
      .resize(new_size.width, new_size.height, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .jpeg({
        quality: QUALITY
      })
      //.extract(extractSize)
      .toBuffer();
    } else {
      return await Promise.resolve(true);
    }
  }

  console.log(size, dimensions, new_size, calcsize);

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
      CacheControl: "max-age=31536000",
      ContentType: contentType
     }, function(err, data) {
       if (err) {
         reject(err); // an error occurred
       } else {
          console.log("putS3Object success", bucket, key);
          resolve(data);           // successful response
       }
  
     });
  })
  
}

function putFileToOrignBucket(source, target){
  console.log("putFile", source, target);
  return new Promise((resolve, reject)=>{

    getUploadFileBody(source)
    .then((data)=>{
      //console.log(data);
      return putFile(target, data);
    })
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })

  }) 
}


function getUploadFileBody(source){
  return new Promise((resolve, reject) => {
    
    s3.getObject({
      Bucket: source.bucket,
      Key: source.key
    }, function(err, data){
      if(err) {
        console.log(err);
        reject(err);
      } else {
        //console.log("getUploadFileBody", data)
        resolve(data.Body);
      }
    });
  })

}

function putFile(target, body){
  return new Promise((resolve, reject) => {
    s3.putObject({
      Bucket: target.bucket,
      Key: target.key,
      Body: body
    }, function(err, data){
      if(err) reject(err);
      else resolve(data);
    });
  })

}