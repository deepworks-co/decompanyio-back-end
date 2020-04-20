const mongoose = require('mongoose');
const models = require('./src/model');

function connectToDB(endpoint){
  mongoose.connect(endpoint, {useNewUrlParser: true, useUnifiedTopology: true});
  mongoose.Promise = global.Promise;
  if(process.env.local){
    mongoose.set('debug', true);
  }
  return mongoose.connection;
}
/*
function connectToMongoDB(){

  return new Promise((resolve, reject)=>{
    //console.log("mongodb connecting!!", mongodb.endpoint)
    mongoose.connect(mongodb.endpoint, {useNewUrlParser: true});
    
    if(process.env.local){
      mongoose.set('debug', true);
    }
    
    mongoose.Promise = global.Promise;
    db = mongoose.connection;
    db.id = crypto.randomBytes(32).toString('hex')
    db.on('error', function(err){
        console.log('MONGOOSE ERROR', err)
        reject(err);
    });
    db.once('open', function() {
        // we're connected!
        //console.log("mongodb connected");
        resolve(db);
    });
    db.once('close', function() {
        // we're connected!
        console.log("mongodb closed", db.id);
    });
  })

  
}
*/
const mongoDBStatus = () => {
  return { 
     dbState: mongoose.STATES[mongoose.connection.readyState],
     readyState: mongoose.connection.readyState
  }
};


module.exports.models = models;
//module.exports.connectToMongoDB = connectToMongoDB;
module.exports.mongoDBStatus = mongoDBStatus;
module.exports.connectToDB = connectToDB;