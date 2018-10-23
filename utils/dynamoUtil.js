var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "DEV-CA-DOCUMENT";
const TABLE_NAME_VOTE = "DEV-CA-DOCUMENT-VOTE";

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
        }

        return docClient.query(params).promise();
    },

    putDocument : putDocument = (item, callback) => {
        const timestamp = Date.now();

        console.log("Put Document Item", item);
        console.log("timestamp", timestamp);
        const mergedItem = {
          "created": Number(timestamp),
          "state": "NOT_CONVERT",
          "viewCount": 0
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

    makeQueryCondition : makeQueryCondition = (args) => {
      let condition = {};
      let indexName = "state-created-index";
      let expresstion = null;
      let attributeNames = null;
      let attributeValues = null;
      if(args.email){

        condition.indexName = "gi-accountId-created-index-copy";
        condition.expression = "#accountId = :accountId"
        condition.filterExpression = "#state = :state"
        condition.attributeNames = ({
            "#accountId": "accountId",
            "#state": "state"

        });
        condition.attributeValues = ({
          ":accountId": args.email,
          ":state": "CONVERT_COMPLETE"
        });

      } else {

        condition.indexName = "state-created-index";
        condition.expression = "#state = :state"
        condition.attributeNames = ({
            "#state": "state"
        });
        condition.attributeValues = ({
          ":state": "CONVERT_COMPLETE"
        });

      }

      return condition;
    },

    queryDocumentByLatest : queryDocumentByLatest = (args) => {
      let key = null;
      if(args.nextPageKey){
          key = args.nextPageKey;
      }

      const queryCondition = makeQueryCondition(args);
      console.log("queryCondition", queryCondition);
      var params = {
          TableName: TABLE_NAME,
          IndexName: queryCondition.indexName,
          ScanIndexForward:false,
          KeyConditionExpression: queryCondition.expression,
          FilterExpression: queryCondition.filterExpression,
          ExpressionAttributeNames: queryCondition.attributeNames,
          ExpressionAttributeValues: queryCondition.attributeValues,
          Limit:20,
          ExclusiveStartKey: key
      };
      console.log("dynamo query params", params);
      return docClient.query(params).promise();

    },

    putVote : putVote = (item) => {
        const timestamp = Date.now();

        console.log("Put Vote Item", item, "timestamp", timestamp);

        const curatorId = item.curatorId;
        const voteAmount = item.voteAmount;
        const documentInfo = item.documentInfo;
        const documentId = documentInfo.documentId;
        const transactionInfo = item.transactionInfo

        if(!curatorId || !voteAmount || !documentId || isNaN(voteAmount)){
          return Promise.reject({msg:"Parameter is invaild", detail:item});
        }

        const id = curatorId + "#" + timestamp;

        var params = {
            TableName: TABLE_NAME_VOTE,
            Item: {
              id: id,
              created: timestamp,
              documentId: documentId,
              voteAmount: Number(voteAmount),
              documentInfo: documentInfo,
              transactionInfo: transactionInfo
            },
            ReturnConsumedCapacity: "TOTAL"
        };


        return docClient.put(params).promise();
    },
}