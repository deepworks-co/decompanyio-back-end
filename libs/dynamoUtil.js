var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "DEV-CA-DOCUMENT";

module.exports = {
    getDocumentById : getDocumentById = (documentId) => {
        var params = {
            TableName: TABLE_NAME,
            IndexName: "documentId-index",
            KeyConditionExpression: "#documentId = :documentId",
            ExpressionAttributeNames:{
                "#documentId": "documentId"
            },
            ExpressionAttributeValues: {
                ":documentId": documentId
            }
        };

        return docClient.query(params).promise();

    },

    putDocument : putDocument = (item, callback) => {
        const timestamp = Date.now();

        console.log("Put Document Item", item);
        console.log("timestamp", timestamp);
        const mergedItem = {
          "created": Number(timestamp),
          "state": "NOT_CONVERT"
        };

        var params = {
            TableName: TABLE_NAME,
            Item: Object.assign(mergedItem, item),
            ReturnConsumedCapacity: "TOTAL"
        };

        console.log("Put Item", params);

        docClient.put(params, (err, data) => {
          if(err) console.error("[SERVER ERROR]", err);

          callback(err, data);
        });
    },

    queryDocumentByLatest : queryDocumentByLatest = (args, callback) => {

        var params = {
            TableName: TABLE_NAME,
            IndexName: "state-created-index",
            ScanIndexForward:false,
            KeyConditionExpression: "#state = :state",
            ExpressionAttributeNames:{
                "#state": "state"
            },
            ExpressionAttributeValues: {
                ":state": "CONVERT_COMPLETE"
            }
        };
        docClient.query(params, function(err, data) {
            callback(err, data);
        });

    },
}
