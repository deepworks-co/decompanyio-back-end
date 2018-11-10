var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "DEV-CA-DOCUMENT";
const TABLE_NAME_VOTE = "DEV-CA-DOCUMENT-VOTE";
const TABLE_NAME_TOTALVIEWCOUNT = "DEV-CA-CRONHIST-TOTALVIEWCOUNT";

const utils = require('../functions/commons/utils.js');

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
      console.log("makeQueryCondition", args);
      let condition = {};
      let indexName = "state-created-index";
      let expresstion = null;
      let attributeNames = null;
      let attributeValues = null;
      if(args.email){

        condition.indexName = "accountId-created-index";
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

        if(args.path && args.path.lastIndexOf("popular")>0){
          condition.indexName = "state-confirmAuthorReward-index";
        } else if(args.path && args.path.lastIndexOf("featured")>0){
          condition.indexName = "state-confirmVoteAmount-index";
        } else {
          condition.indexName = "state-created-index";
        }

        condition.expression = "#state = :state"
        if(args.tag){
          condition.filterExpression = "contains(#tags, :tag)"
          condition.attributeNames = ({
              "#state": "state",
              "#tags": "tags"
          });
          condition.attributeValues = ({
            ":state": "CONVERT_COMPLETE",
            ":tag": args.tag
          });


        } else {
          condition.attributeNames = ({
              "#state": "state"
          });
          condition.attributeValues = ({
            ":state": "CONVERT_COMPLETE"
          });
        }
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
          Limit:50,
          ExclusiveStartKey: key
      };
      console.log("dynamo query params", params);
      return docClient.query(params).promise();

    },

    queryVotedDocumentByCurator : queryVotedDocumentByCurator = (args) => {
      let key = null;
      if(args.nextPageKey){
          key = args.nextPageKey;
      }
      const accountId = args.accountId;

      var params = {
          TableName: "DEV-CA-VOTE-HIST",
          IndexName: "curatorId-created-index",
          ScanIndexForward:false,
          KeyConditionExpression: "#curatorId = :curatorId",
          ExpressionAttributeNames: {
            "#curatorId": "curatorId"
          },
          ExpressionAttributeValues: {
            ":curatorId": accountId
          },
          Limit:50,
          ExclusiveStartKey: key
      };
      console.log("dynamo queryDocumentByCurator params", params);
      return docClient.query(params).promise();

    },

    queryTodayVotedDocumentByCurator : queryTodayVotedDocumentByCurator = (args) => {
      let key = null;
      if(args.nextPageKey){
          key = args.nextPageKey;
      }
      const accountId = args.accountId;
      const today = new Date();
      const blockchainTimestamp = utils.getBlockchainTimestamp(today);
      var params = {
          TableName: "DEV-CA-VOTE-HIST",
          IndexName: "curatorId-created-index",
          ScanIndexForward:false,
          KeyConditionExpression: "#curatorId = :curatorId and #created > :created",
          ExpressionAttributeNames: {
            "#curatorId": "curatorId",
            "#created": "created"
          },
          ExpressionAttributeValues: {
            ":curatorId": accountId,
            ":created": blockchainTimestamp
          },
          Limit:50,
          ExclusiveStartKey: key
      };
      console.log("dynamo queryTodayVotedDocumentByCurator params", params);
      return docClient.query(params).promise();

    },

    queryTotalViewCountByToday : queryTotalViewCountByToday = (date) => {

      var params = {
          TableName: TABLE_NAME_TOTALVIEWCOUNT,
          KeyConditionExpression: "#date = :date",
          ExpressionAttributeNames: {
            "#date": "date"
          },
          ExpressionAttributeValues: {
            ":date": date
          },
          ScanIndexForward:false,
          Limit:1
      };
      console.log("dynamo queryTotalViewCountByToday params", params);
      return docClient.query(params).promise();

    },

    putVote : putVote = (item) => {
      const timestamp = Date.now();
      const today = new Date(timestamp);

      const blockchainTimestamp = utils.getBlockchainTimestamp(today);

        console.log("Put Vote Item", item, "timestamp", timestamp);

        const curatorId = item.curatorId;
        const voteAmount = item.voteAmount;
        const documentInfo = item.documentInfo;
        const documentId = documentInfo.documentId;
        const transactionInfo = item.transactionInfo;
        const ethAccount = item.ethAccount;
        if(!curatorId || !voteAmount || !documentId || isNaN(voteAmount) || !ethAccount){
          return Promise.reject({msg:"Parameter is invaild", detail:item});
        }

        var params = {
            TableName: TABLE_NAME_VOTE,
            Item: {
              id: curatorId,
              created: timestamp,
              blockchainTimestamp: blockchainTimestamp,
              documentId: documentId,
              voteAmount: Number(voteAmount),
              documentInfo: documentInfo,
              ethAccount: ethAccount,
              transactionInfo: transactionInfo
            },
            ReturnConsumedCapacity: "TOTAL"
        };


        return docClient.put(params).promise();
    },

    updateVoteHist : updateVoteHist = (item) => {
      const timestamp = Date.now();
      const today = new Date(timestamp);

      const blockchainTimestamp = utils.getBlockchainTimestamp(today);

      console.log("Put Vote Item", item, "timestamp", timestamp, "blockchainTimestamp", blockchainTimestamp);

      const curatorId = item.curatorId;
      const voteAmount = Number(item.voteAmount);
      const documentInfo = item.documentInfo;
      const documentId = documentInfo.documentId;
      const transactionInfo = item.transactionInfo;
      const ethAccount = item.ethAccount;   //curator's ether account
      const state = item.state;
      if(!curatorId || !voteAmount || !documentId || isNaN(voteAmount) || !ethAccount){
        return Promise.reject({msg:"Parameter is invaild", detail:item});
      }

      const queryKey = {
        id: blockchainTimestamp + "#" + documentId,
        curatorId: curatorId
      }

      const updateItem = {
          TableName: "DEV-CA-VOTE-HIST",
          Key: queryKey,
          UpdateExpression: "set #created=:created, #documentId=:documentId, \
          #ethAccount = list_append(if_not_exists(#ethAccount, :empty_list), :ethAccount), \
          #voteAmount = list_append(if_not_exists(#voteAmount, :empty_list), :voteAmount), \
          #documentInfo = :documentInfo, #state = :state, #transactionInfo = :transactionInfo",
          ExpressionAttributeNames: {
              "#voteAmount": "voteAmount",
              "#created": "created",
              "#ethAccount": "ethAccount",
              "#documentId": "documentId",
              "#documentInfo": "documentInfo",
              "#state": "state",
              "#transactionInfo": "transactionInfo"
          },
          ExpressionAttributeValues: {
              ":voteAmount": [Number(voteAmount)],
              ":created": timestamp,
              ":ethAccount": [ethAccount],
              ":documentId": documentId,
              ":empty_list": [],
              ":documentInfo": documentInfo,
              ":state": state?state:"INIT",
              ":transactionInfo": transactionInfo?transactionInfo:{}
          },
          ReturnValues: "UPDATED_NEW"
      }

      return docClient.update(updateItem).promise();
    },

    getDocumentsOrderByViewCount : getDocumentsOrderByViewCount = (args) => {
      let key = null;
      if(args && args.nextPageKey){
          key = args.nextPageKey;
      }

      var params = {
          TableName: TABLE_NAME,
          IndexName: "state-voteAmount-index",
          ScanIndexForward: false,
          KeyConditionExpression: "#state = :state",
          ExpressionAttributeNames: {
            "#state": "state"
          },
          ExpressionAttributeValues: {
            ":state": "CONVERT_COMPLETE"
          },
          Limit:5,
          ExclusiveStartKey: key
      };
      console.log("getDocumentsOrderByViewCount params", params);
      return docClient.query(params).promise();
    },
}
