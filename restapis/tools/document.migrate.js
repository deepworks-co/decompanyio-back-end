'use strict';
var mongojs = require('mongojs')
var fs = require('fs');
var util = require('util');
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

exec();

async function exec(){
    try{
        const docs = await getList();
        console.log(utils, sqs);
        console.log(docs.length);
        const promises = docs.map((doc)=>{
            return sendMessageConvertDoc(doc);
        })

        console.log(await Promise.all(promises));
    } catch(e){
        console.log(e);
    } finally{
        db.close();
    }
  
}

async function getList(){
    return new Promise((resolve, reject)=>{
        db.collection(TB_DOCUMENT).find({state: "CONVERT_COMPLETE"}).sort({created: -1}).limit(1000).skip(407, function (err, docs){
            if(err) reject(err);
            else resolve(docs);
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