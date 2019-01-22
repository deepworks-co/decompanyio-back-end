'use strict';
var mongojs = require('mongojs')
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};
   
var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();


const connectionString = "decompany:decompany1234@127.0.0.1/decompany"


const  execute = async (source, target) => {
  let count = 0;
  console.log("runing!!!! data.migrate.js");
  const db = mongojs(connectionString);
  try{
    
    const mycollection = db.collection(target);

    const params = {
      TableName: source
    }

    const data = await docClient.scan(params).promise();
    let i = 0;
    for(i=0;i<data.Items.length;i++){
      //console.log(JSON.stringify(item));
      const item = data.Items[i];
      mycollection.save(item);
      count++;
    }
    console.log("total migrate: " + source + " to " + target + " count : " + i);
    /*
    data.Items.forEach((item) => {
      //console.log(JSON.stringify(item));
      //mycollection.save(item);
      count++;
      console.log("update ", count);
    });
    */
  } catch(e) {
    console.error(e);
  } finally{
    console.log("db.close()");
    db.close();
  }
 
};

const TABLE_NAME = "DEV-CA-DOCUMENT";
const TABLE_NAME_VOTE = "DEV-CA-DOCUMENT-VOTE";
const TABLE_NAME_TOTALVIEWCOUNT = "DEV-CA-CRONHIST-TOTALVIEWCOUNT";

execute(TABLE_NAME, "DC-DOCUMENT")
execute(TABLE_NAME_VOTE, "DC-DOCUMENT-VOTE");
execute(TABLE_NAME_TOTALVIEWCOUNT, "DC-DAILY-TOTALVIEWCOUNT");

/*
#login admin
use admin
db.createUser({
  user: "root",
  pwd: "1234",
  roles: [ { role: "root", db: "admin" } ]
})

db.auth("root", "1234")

#create database and create user
use decompany
db.createUser(
   {
     user: "decompany",
     pwd: "decompany1234",
     roles: [{role: "readWrite", db: "decompany"} ]
   }
)
db.auth("decompany", "decompany1234")
*/

/*

db.createCollection("DC-DOCUMENT", { capped: false,
                              size: <number>,
                              max: <number>,
                              storageEngine: <document>,
                              validator: <document>,
                              validationLevel: <string>,
                              validationAction: <string>,
                              indexOptionDefaults: <document>,
                              viewOn: <string>,
                              pipeline: <pipeline>,
                              collation: <document>,
                              writeConcern: <document>} )



                    

*/

/**
 
#create index
db.USER.createIndex({id: 1}, {unique:true})
 */