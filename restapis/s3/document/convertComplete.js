'use strict';
const { mongodb, tables, s3Config } = require('decompany-app-properties');
const { MongoWapper } = require('decompany-common-utils');
const sharp = require("sharp");
const sizeOf = require('buffer-image-size');

var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-1"
});
const s3 = new AWS.S3();

const TABLE_NAME = tables.DOCUMENT;
const CONVERT_COMPLETE = "CONVERT_COMPLETE";

const QUALITY = 80;

exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  //console.log("convertCompete Event", JSON.stringify(event));

  //THUMBNAIL/aaaaa/300X300/1
  //THUMBNAIL/05593afb-6748-47df-af76-6803e7f86378/1200X1200/1, 2, 3, 4,5 max page number
  
  const result = await run(event);

  return callback(null, result);

};

async function run(event){

  const promises = await event.Records.map(async (record) =>  {
    const key = record.s3.object.key;
    const bucket = record.s3.bucket.name;
    
    const keys = key.split("/");
    const prefix = keys[0];
    const documentId = keys[1];
    const filename = keys[2];
    
    console.log("convertComplete start", key, prefix, documentId, filename);
    if("result.txt" == filename){       
      return runConvertComplete(bucket, key, documentId);
    } else if("text.json" == filename) {
        //아무것도 안함
    } else if("1200X1200" === filename){
      //프리뷰이미지 metadata content-type : image/png
      const r = await changeImageMetadata(bucket, key);
      console.log("changeImageMetadata", r)
      const type = keys[0]; //THUMBNAIL
      const documentId = keys[1]; // ${documentId}
      const sizeType = keys[2]; //1200X1200, 300X300
      const imagename = keys[3];  // 1, 2, 3
      const sizes = ['thumb', 1024, 640, 320, 2048];
      const promises = sizes.map((size)=>{
        const toProfix = documentId + "/" + size + "/" + imagename;
        return convertJpeg({fromBucket: bucket, fromPrefix: key}, {toBucket: s3Config.thumbnail, toPrefix: toProfix}, size);
      });   

      return Promise.all(promises);
    }

  });

  const result = await Promise.all(promises);
  console.log("converter result", result);
  return result;
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

function runConvertComplete(bucket, key, documentId){

  console.log(bucket, key, documentId);
  const totalPagesPromise = getTotalPages(bucket, key);
  const getDocumentPromise = getDocument(documentId);

  return new Promise((resolve, reject) => {
    Promise.all([totalPagesPromise, getDocumentPromise]).then((data) => {       
      //console.log(data);
      let totalPages = -1;
      const resultTxtFile = data[0];
      const document = data[1];
      console.log(document);
      if(!document){
        throw new Error("documet is not exist, " + documentId);
      }

      if(resultTxtFile){
        totalPages = resultTxtFile.Body.toString('ascii');
        totalPages *= 1;
      }

      console.log("documentId", documentId, "totalPages", totalPages);
      if(totalPages>0 && documentId) {
  
        updateConvertCompleteDocument(documentId, totalPages).then((data) =>{
          console.log("Update SUCCESS CONVERT_COMPLETE", documentId);
          resolve({message: "SUCCESS",
                  documentId: documentId});
        }).catch((err)=> {
          console.error("Unable to update item. Error JSON:", documentId, JSON.stringify(err, null, 2));
          reject(err);
        });
      }
  
    }).catch((errs) => {
      console.error("Error Promise!!! result.txt process", errs);
      reject(errs);
    });
  });

}

function getTotalPages(bucket, key){
  return s3.getObject({
      Bucket: bucket,
      Key: key
  }).promise();
}

async function getDocument(documentId){
  
  //throw new Error("error getDocument() : " + documentId);
  const wapper = new MongoWapper(mongodb.endpoint);
  return await wapper.findOne(TABLE_NAME, {_id: documentId});

}

async function updateConvertCompleteDocument(documentId, totalPages){
  const wapper = new MongoWapper(mongodb.endpoint);

  const document = await wapper.findOne(TABLE_NAME, {_id: documentId});

  if(document){
    document.state = "CONVERT_COMPLETE";
    document.totalPages = Number(totalPages);

    return await wapper.save(TABLE_NAME, document);
  } else {
    console.log("document doesn't found", document);
  }

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

      output = await sharp(input)
      .resize(calcsize, calcsize, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .jpeg({
        quality: QUALITY
      })
      .toBuffer();
      output = await sharp(output).extract({left: new_size.width/2 - 160, top: new_size.height/2 - 120, width: 320, height: 240}).toBuffer()
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
      Metadata: {
        "Cache-Control": "max-age=31536000" 
      },
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
