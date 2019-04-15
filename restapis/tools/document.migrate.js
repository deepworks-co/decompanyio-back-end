'use strict';
var AWS = require('aws-sdk');

var mongojs = require('mongojs')
var fs = require('fs');
var util = require('util');

const s3 = new AWS.S3();

const {utils, sqs} = require('decompany-common-utils');
const connectionString = "mongodb://decompany:decompany1234@54.183.187.54:27017/decompany"
const TB_DOCUMENT = "DOCUMENT";

const db = mongojs(connectionString);
db.on('error', function (err) {
	console.log('database error', err)
})

db.on('connect', function () {
    console.log('database connected'); 
});
const npmArgs = process.argv.slice(2);
exec(npmArgs);

async function exec(args){
    try{
        
        const docs = await getList();
        
        console.log("totlal search count : ", docs.length);
        const promises = await docs.map((doc, index)=>{
            return isPrefixExists(doc);               
            
        })
        const resultList = await Promise.all(promises);
        const nonExistsKey = resultList.filter((item)=>{
            return item.exists === false
        }).map(item=>{
            if('migration' === args[0]){
                return sendMessageConvertDoc(item.doc);
            } else {
                return makeSQSMessageBody(item.doc);
            }            
        });
        
        
        const result = await Promise.all(nonExistsKey);
        console.log("migration result", result);
        console.log("migration result", result.length);

    } catch(e){
        console.log(e);
    } finally{
        db.close();
    }
  
}

async function getList(){
    return new Promise((resolve, reject)=>{
        db.collection(TB_DOCUMENT).find({state: "CONVERT_COMPLETE"}).sort({created: -1}).toArray(function (err, docs){
            if(err) reject(err);
            else resolve(docs);
        })
    })
    
}

async function isPrefixExists(doc){
    
    return new Promise((resolve, reject)=>{
        var params = {
            Bucket: "dev-ca-thumbnail.decompany.io",
            Key: doc._id + "/1024/1"
           };
        
        s3.headObject(params, function(err, data){
            if(err) resolve({doc: doc, exists:false});
            else {
                //console.log(data);
                resolve({doc: doc, exists:true});
            }
        })
    })
   

}

async function sendMessageConvertDoc(doc){
    /**
     * {"command":"image","filePath":"dev-ca-document/FILE/0x8B1D39Cd838B6ceBA4ef2475994c6fc66fD1E100/e94496d0c8e947ad8d337d51ac0bc03c.pdf","storagePath":"dev-ca-document/THUMBNAIL/e94496d0c8e947ad8d337d51ac0bc03c","resolutionX":1200,"resolutionY":1200,"startPage":1,"endPage":10,"accesskey":"","secretKey":"","ext":"pdf","owner":"0x8B1D39Cd838B6ceBA4ef2475994c6fc66fD1E100"}
     */
  
    const exts = doc.documentName.substring(doc.documentName.lastIndexOf(".") + 1);
    const messageBody = JSON.stringify({
      command: "image",
      filePath: "dev-ca-document/FILE/" + doc.accountId + "/" + doc._id +"."+ exts,
      storagePath: "dev-ca-document/THUMBNAIL/" + doc._id,
      "resolutionX":1200,
      "resolutionY":1200,
      "startPage":1,
      "endPage":10,
      "ext": exts,
      "owner": doc.accountId
    });
    
    const queueUrl = "https://sqs.us-west-1.amazonaws.com/197966029048/DEV-CA-CONVERT-IMAGE"
    console.info(queueUrl, messageBody);
    return await sqs.sendMessage("us-west-1", queueUrl, messageBody);
  }

  function makeSQSMessageBody(doc){
    const exts = doc.documentName.substring(doc.documentName.lastIndexOf(".") + 1);
      return JSON.stringify({
        command: "image",
        filePath: "dev-ca-document/FILE/" + doc.accountId + "/" + doc._id +"."+ exts,
        storagePath: "dev-ca-document/THUMBNAIL/" + doc._id,
        "resolutionX":1200,
        "resolutionY":1200,
        "startPage":1,
        "endPage":10,
        "ext": exts,
        "owner": doc.accountId
      });
  }