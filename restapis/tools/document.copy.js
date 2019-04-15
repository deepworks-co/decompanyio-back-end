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

        const promises = docs.map((doc)=>{
            console.log(doc);
            const ext = doc.documentName.substring(doc.documentName.lastIndexOf(".")+1);
            const key = `FILE/${doc.accountId}/${doc._id}.${ext}`
            const sourceBucket = "dev-ca-thumbnail.decompany.io"
            const targetBucket = "dev-ca-document-copy"
            
            const params = {
                Key: key,
                Bucket: targetBucket,
                CopySource: sourceBucket + "/" + key
            };
            console.log(params);
            return s3.copyObject(params).promise();
            //return params;

        });
        
        console.log("totlal search count : ", docs.length);

        const results = await Promise.all(promises);

        console.log("complete!", results.length);
        
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

async function folderCopy(params){
    const {bucket, prefix} = params;
    const data = await s3.listObjects({
        Bucket: bucket,
        Prefix: prefix
    }).promise();


    data.Contents.forEach((content)=>{
        console.log(content.Key);
    })
}
