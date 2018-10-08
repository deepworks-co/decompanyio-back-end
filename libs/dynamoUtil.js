var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "DEV-CA-DOCUMENT";

module.exports = {
    getDocument : getDocument = (args, callback) => {
        var params = {
            TableName: TABLE_NAME,
            Key:{
                "accountId": args.accountId,
                "documentId": args.documentId
            }
        };

        docClient.get(params, (err, data) => {
          callback(err, data);
        });

    },

    getDocuments : getDocuments = (args, callback) => {

        console.log("getDocument", args);

        var params = {
            TableName : TABLE_NAME,
            KeyConditionExpression: " ",
            ExpressionAttributeNames:{
                "#accountId": "accountId",
                "#documentId": "documentId"
            },
            ExpressionAttributeValues: {
                ":accountId": args.accountId,
                ":documentId": args.documentId
            }
        };

        docClient.query(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("Query succeeded.", data);
                data.Items.forEach(function(item) {
                    console.log(" -", item.year + ": " + item.title);
                });
            }
        });

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
