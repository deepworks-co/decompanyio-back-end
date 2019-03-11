'use strict';
var mongojs = require('mongojs')
var fs = require('fs');
var util = require('util');
const {utils} = require('decompany-common-utils');
const connectionString = "mongodb://decompany:decompany1234@52.53.183.122:27017/decompany"
const TB_DOCUMENT = "DOCUMENT";
const TB_SEOFRIENDLY = "SEO-FRIENDLY";
const db = mongojs(connectionString);
db.on('error', function (err) {
	console.log('database error', err)
})

db.on('connect', function () {
    console.log('database connected');
    
});

async function execute(){
    const result = await getList();
    result.forEach((doc, index)=>{

        try{
            const seoTitle = utils.toSeoFriendly(doc.title)
            if(seoTitle){
                
                updateDocument(doc, seoTitle);
                updateSeoFriendly(doc, seoTitle);
            } else {
                console.log(doc._id);
            }
                
            
            
        } catch (err){
            console.error(doc._id, err);
        }

    });
}

function getList(){

    return new Promise((resolve, reject)=>{
        db.collection(TB_DOCUMENT).find(function(err, docs) {
            if(err) reject(err);
            else resolve(docs);            
        });
    }); 
}

async function updateDocument(doc, seoTitle){

    return new Promise((resolve, reject)=>{
        
        doc.seoTitle = seoTitle;
        db.collection(TB_DOCUMENT).save(doc, function(err, doc){
            if(err) reject(err);
            else resolve(doc);
        });
    })
    
}

function updateSeoFriendly(doc, seoTitle) {
    return new Promise((resolve, reject) => {
        db.collection(TB_SEOFRIENDLY).insert({
            _id: seoTitle,
            type: "DOCUMENT",
            id: doc.documentId,
            created: Date.now()
        }, function(err, doc) {
            if(err) reject(err);
            else resolve(doc);
        });
    })
    
}

execute();