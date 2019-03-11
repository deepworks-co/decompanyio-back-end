'use strict';
var mongojs = require('mongojs')
var fs = require('fs');
var util = require('util');
const {utils} = require('decompany-common-utils');
const connectionString = "mongodb://decompany:decompany1234@52.53.183.122:27017/decompany"
const TB_TRACKING_USER = "DOCUMENT-TRACKING-USER";
const db = mongojs(connectionString);
db.on('error', function (err) {
	console.log('database error', err)
})

db.on('connect', function () {
    console.log('database connected');
    
});

async function execute(){
    try{
        const result = await getList();
        result.forEach((item)=>{
            insert({
                _id: item.cid,
                e: item.e,
                created: item.created
            })
        })
        console.log(result);
    } catch(e){
        console.log(e);
    }
    
    
}

function getList(){

    return new Promise((resolve, reject)=>{

        const query = [{
            $group: {
              _id: {cid: "$cid"},
              cid: {$first: "$cid"},
              e: {$first: "$e"},
              created: {$first: "$created"},
            }
        }]
        
        db.collection(TB_TRACKING_USER).aggregate(query, function(err, docs) {
            if(err) reject(err);
            else resolve(docs);            
        });
    }); 
}

function insert(doc){

    return new Promise((resolve, reject)=>{

        const query = [{
            $group: {
              _id: {cid: "$cid"},
              cid: {$first: "$cid"},
              e: {$first: "$e"},
              created: {$first: "$created"},
            }
        }]
        
        db.collection(TB_TRACKING_USER).insert(doc);
    }); 
}

execute();