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
const TABLE_NAME = "DEV-CA-DOCUMENT";
const TABLE_NAME_VOTE = "DEV-CA-DOCUMENT-VOTE";
const TABLE_NAME_TOTALVIEWCOUNT = "DEV-CA-CRONHIST-TOTALVIEWCOUNT";

const connectionString = "decompany:decompany1234@127.0.0.1/decompany"




const  execute = async () => {
  const tableName = TABLE_NAME_TOTALVIEWCOUNT;
  const db = mongojs(connectionString);
  const mycollection = db.collection(tableName);

  db.on('error', function (err) {
  	console.log('database error', err)
  })

  db.on('connect', function () {
  	console.log('database connected');

  })

  console.log("runing!!!! data.migrate.js");

  mycollection.count({}, (data) => {
    console.log("count", data);
  });

  const params = {
    TableName: tableName
  }

  docClient.scan(params, (err, data)=>{

    if(err) {
      console.err(err);
      throw err
    }
    data.Items.forEach((item) => {
      //console.log(JSON.stringify(item));

      mycollection.save(item);

    });
  });

};

execute();

/*
#login admin
use admin
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
*/

/*

db.createCollection("DE-CONTENTS", { capped: false,
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
