'use strict';
const { mongodb, tables, s3 } = require('../../resources/config.js').APP_PROPERTIES();
const {MongoWapper} = require('decompany-common-utils');

var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-1"
});
var s3 = new AWS.S3();

const TABLE_NAME = tables.DOCUMENT;
const CONVERT_COMPLETE = "CONVERT_COMPLETE";

exports.handler = (event, context) => {
  //console.log("convertCompete Event", JSON.stringify(event));

  //THUMBNAIL/aaaaa/300X300/1
  //THUMBNAIL/05593afb-6748-47df-af76-6803e7f86378/1200X1200/1, 2, 3, 4,5 max page number
  
  run(event).then((success)=>{
    context.done(null, success);
  }).catch((err)=>{
    context.done(err);
  })

};

async function run(event){
  let i=0;
  let promises = [];
  const promises = await event.Records.map((record) =>  {
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
    } else {
      //프리뷰이미지 metadata content-type : image/png
      convertJpeg({fromBucket: bucket, prefix: key}, {toBucket: s3.thumbnail, prefix: key})
      return changeImageMetadata(bucket, key);  
    }
    i++;
  });
  
  if(promises.length>0){

    await Promise.all(promises).then((data) => {
      console.log("success", data) ;
    }).catch((errs)=>{
      console.error("Error", errs) ;
    });
  }
}

async function changeImageMetadata(bucket, key){
  console.log("changeImageMetadata", bucket, key);
  return await s3.copyObject({
    Bucket: bucket,
    Key: key,
    CopySource: bucket + "/" + key,
    ContentType: "image/png",
    MetadataDirective: 'REPLACE'
  });
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
    console.log("document not found", document);
  }

}


async function convertJpeg(from, to){
  const {fromBucket, fromPrefix} = from;
  const {toBucket, toPrefix} = to;
}