'use strict';
const { mongodb } = require('../../resources/config.js').APP_PROPERTIES();
const MongoWapper = require('../../libs/mongo/MongoWapper.js');

var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-1"
});
var s3 = new AWS.S3();
var docClient = new AWS.DynamoDB.DocumentClient();
var TABLE_NAME = "DEV-CA-DOCUMENT";
const GLOBAL_DOCUMENT_ID_INDEX = "documentId-index";
const CONVERT_COMPLETE = "CONVERT_COMPLETE";

exports.handler = (event, context, callback) => {
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
  await event.Records.forEach((record) =>  {
    const key = record.s3.object.key;
    const bucket = record.s3.bucket.name;
    
    const keys = key.split("/");
    const prefix = keys[0];
    const documentId = keys[1];
    const filename = keys[2];

    if("result.txt" == filename){
        
      const totalPagesPromise = getTotalPages(bucket, key);
      const getDocumentPromise = getDocument(documentId);
            
      
      Promise.all([totalPagesPromise, getDocumentPromise]).then((data) => {       
        //console.log(data);
        let totalPages = -1;
        let accountId = null;
        let documentId = null;
        const resultTxtFile = data[0];
        const document = data[1];
        if(resultTxtFile){
          totalPages = resultTxtFile.Body.toString('ascii');
          totalPages *= 1;
        }
        
        if(document){
            accountId = document.accountId;
            documentId = document.documentId;
        }
          
        console.log("accountId", accountId, "documentId", documentId, "totalPages", totalPages);
        
        if(totalPages>0 && accountId && documentId) {

          updateConvertCompleteDocument(accountId, documentId, totalPages).then((data) =>{
            console.log("Update SUCCESS CONVERT_COMPLETE", accountId, documentId);
          }).catch((err)=> {
            console.error("Unable to update item. Error JSON:", accountId, documentId, JSON.stringify(err, null, 2));
          });
        }
  
      }).catch((errs) => {
        console.error("Error Promise!!! result.txt process", errs);
      });
    
    } else if("document.txt" == filename) {
        //아무것도 안함
    } else {
        //프리뷰이미지 metadata content-type : image/png
        changeImageMetadata(bucket, key).then((data)=>{
          console.log("changeImageMetadata success documentId", documentId);
        }).catch((err)=>{
          console.error(err);
        });
        
    }
    i++;
  });

  return i;
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

function getTotalPages(bucket, key){
  return s3.getObject({
      Bucket: bucket,
      Key: key
  }).promise();
}

async function getDocument(documentId){
  
  //throw new Error("error getDocument() : " + documentId);
  const wapper = new MongoWapper(mongodb.endpoint);
  return await wapper.findOne(TABLE_NAME, {documentId: documentId});

}

async function updateConvertCompleteDocument(accountId, documentId, totalPages){
  try{
    const wapper = new MongoWapper(mongodb.endpoint);

    const document = await wapper.findOne(TABLE_NAME, {documentId: documentId});

    document.state = "CONVERT_COMPLETE";
    document.totalPages = Number(totalPages);

    return await wapper.save(TABLE_NAME, document);
  } catch(e){
    console.error(e);
    throw e
  }
  
}