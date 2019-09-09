const crypto = require('crypto');
const mongoose = require('mongoose');
const {mongodb} = require('decompany-app-properties');
const models = require('./model');
const console = require('../common/logger');
let db;
//console.log("mongoose", mongoose.connection);
function connectToMongoDB(){
  if(!db){
      
    mongoose.connect(mongodb.endpoint, {useNewUrlParser: true});
    mongoose.Promise = global.Promise;
    db = mongoose.connection;
    db.id = crypto.randomBytes(32).toString('hex')
    db.on('error', function(err){
        console.log('MONGOOSE ERROR', err)
    });
    db.once('open', function() {
        // we're connected!
        console.log("mongodb connected");
    });
    db.once('close', function() {
        // we're connected!
        console.log("mongodb closed", db.id);
    });
  } else {
    console.log("cached connection", db.id)
  }
  return db;
}


module.exports.models = models;
module.exports.connectToMongoDB = connectToMongoDB;