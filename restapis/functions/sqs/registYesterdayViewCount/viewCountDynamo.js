const MongoWapper = require('../libs/mongo/MongoWapper.js');
const connectionString = 'mongodb://decompany:decompany1234@localhost:27017/decompany';

const TABLE_NAME = "DEV-CA-CRONHIST-VIEWCOUNT";


exports.startCronViewCount = async (documentId, documentIdByte32, blockchainTimestamp, data) => {
    // Increment an atomic counter
  try{
    const created = Date.now();//timestamp
    const putItem = {
      documentId: documentId,
      documentIdByte32: documentIdByte32,
      date: blockchainTimestamp,
      state: "START",
      viewCountData: data,
      created:created
    };

    const wapper = new MongoWapper(connectionString);
    await wapper.save(TABLE_NAME, putItem);

    console.info("addViewCountHistory SUCCESS", data);
  } catch(err) {
    console.error("[startCronViewCount ERROR]", err);
  }
    
}


exports.completeCronViewCount = async (documentId, blockchainTimestamp, transactionResult, retry) => {
    // Increment an atomic counter
  try{
    const created = Date.now();//timestamp
    const queryKey = {
      documentId: documentId,
      date: blockchainTimestamp
    };

    const wapper = new MongoWapper(connectionString);
    let doc = await wapper.findOne(TABLE_NAME, queryKey);

    doc.state = "COMPLETE";
    doc.transactionResult = transactionResult;
    doc.retry = retry?true:false;

    await wapper.save(TABLE_NAME, doc);
  } catch(e){
    console.error("completeCronViewCount", e);
  }

}

exports.errorCronViewCount = (documentId, blockchainTimestamp, exception, retry) => {
    // Increment an atomic counter
  try{
    const created = Date.now();//timestamp
    const queryKey = {
      documentId: documentId,
      date: blockchainTimestamp
    };

    const wapper = new MongoWapper(connectionString);
    let doc = await wapper.findOne(TABLE_NAME, queryKey);

    doc.state = "ERROR";
    doc.exception = JSON.stringify(exception);
    doc.retry = retry?true:false;

    await wapper.save(TABLE_NAME, doc);
  } catch(e){
    console.error("errorCronViewCount", e);
  }
}
