const MongoWrapper = require("./src/MongoWrapper");

const mongo = new MongoWrapper("mongodb://decompany:decompany1234@52.53.208.45:27017/decompany?connectTimeoutMS=1000&socketTimeoutMS=1000");

async function run(){

  console.log("database", mongo.database());
  //console.log("collections", await mongo.collections());
  console.log("1111", await mongo.status());
  console.log("get document length", await mongo.count("DOCUMENT", {}));
  mongo.close();
  await sleep(3000);
  console.log("2222", await mongo.status());
  console.log("get document length", await mongo.count("DOCUMENT", {}));
  return "end"
}


run().then((data)=>{
  console.log("COMPLETE", data);
  mongo.close();
}).catch((err)=>{
  console.error("ERROR", err);
});

const sleep = (ms) => {
  return new Promise(resolve=>{
      console.log("sleep", ms)
      setTimeout(resolve,ms)
  })
}