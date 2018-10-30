const AWS = require('aws-sdk');
AWS.config.update({
  region: "us-west-1",
});
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const TABLE_NAME = "DEV-CA-CRONHIST-VIEWCOUNT";
const docClient = new AWS.DynamoDB.DocumentClient();

exports.startCronViewCount = (documentId, documentIdByte32, blockchainTimestamp, data) => {
    // Increment an atomic counter
    const created = Date.now();//timestamp
    const putItem = {
      documentId: documentId,
      documentIdByte32: documentIdByte32,
      date: blockchainTimestamp,
      state: "START",
      viewCountData: data,
      created:created
    };

    var params = {
        TableName: TABLE_NAME,
        Item: putItem,
        ReturnConsumedCapacity: "TOTAL"
    };

    docClient.put(params, (err, data) => {
      if(err){
        console.error("[startCronViewCount ERROR]", err);
      } else {
        console.info("addViewCountHistory SUCCESS", data);
      }
    });
}


exports.completeCronViewCount = (documentId, blockchainTimestamp, transactionResult, retry) => {
    // Increment an atomic counter
    const created = Date.now();//timestamp
    const queryKey = {
      documentId: documentId,
      date: blockchainTimestamp
    };

    docClient.update({
        TableName:TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set #state = :state, transactionResult = :transactionResult, retry = :retry",
        ExpressionAttributeNames:{
          "#state": "state",
        },
        ExpressionAttributeValues:{
            ":state": "COMPLETE",
            ":transactionResult": transactionResult,
            ":retry": retry?true:false
        },
        ReturnValues:"UPDATED_NEW"
    }, function(err, data) {
        if(err){
            console.log(err) ;
        }

    });


}

exports.errorCronViewCount = (documentId, blockchainTimestamp, exception) => {
    // Increment an atomic counter
    const created = Date.now();//timestamp
    const queryKey = {
      documentId: documentId,
      date: blockchainTimestamp
    };

    //confirmViewCountHist Key isNotExist create
    docClient.update({
        TableName: TABLE_NAME,
        Key:queryKey,
        UpdateExpression: "set #state = :state, exception = :exception, retry = :retry",
        ExpressionAttributeNames:{
          "#state": "state",
        },
        ExpressionAttributeValues:{
            ":state": "ERROR",
            ":exception": exception,
            ":retry": retry?true:false
        },
        ReturnValues:"UPDATED_NEW"
    }, function(err, data) {
        if(err){
            console.log(err) ;
        }

    });
}
