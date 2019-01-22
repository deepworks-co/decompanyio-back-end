const utils = require('decompany-common-utils');
const { mongodb } = require('../resources/config.js').APP_PROPERTIES();
const MongoWapper = require('../libs/mongo/MongoWapper.js');

const TABLE_NAME = "DEV-CA-DOCUMENT";
const TABLE_NAME_VOTE = "DEV-CA-DOCUMENT-VOTE";
const TABLE_NAME_TOTALVIEWCOUNT = "DEV-CA-CRONHIST-TOTALVIEWCOUNT";


const connectionString = mongodb.endpoint;

module.exports = {
    getDocumentById : getDocumentById = async (documentId) => {
      const wapper = new MongoWapper(connectionString);
      return await wapper.findOne(TABLE_NAME, {documentId: documentId});
    },

    putDocument : putDocument = async (item, callback) => {
        const timestamp = Date.now();
        /* default value */
        const mergedItem = {
          "created": Number(timestamp),
          "state": "NOT_CONVERT",
          "viewCount": 0
        };
        const params = Object.assign(mergedItem, item)
        console.log("Save New Item", params);

        const wapper = new MongoWapper(connectionString);
        return await wapper.insert(TABLE_NAME, params);
    },

    queryDocumentByLatest : queryDocumentByLatest = async (args) => {
      console.log("queryDocumentByLatest args", args);

      const pageKey = args.pageKey;;
      let nextPageKey = {};
      const pageSize = 10;
      const tag = args.tag;
      const accountId = args.accountId;

      if(pageKey){
          nextPageKey = pageKey;
          nextPageKey.pageNo = Number(pageKey.pageNo) + 1;
      } else {

        nextPageKey = {
          query : {
            state: "CONVERT_COMPLETE",
            tags: tag,
            accountId: accountId
          },
          sort : {
            created: -1
          },
          pageNo: 1,
          pageSize: pageSize
        };

        if(args.path && args.path.lastIndexOf("popular")>0){
          nextPageKey.sort = {confirmAuthorReward: -1};
        } else if(args.path && args.path.lastIndexOf("featured")>0){
          nextPageKey.sort = {confirmVoteAmount: -1};
        }

        Object.keys(nextPageKey.query).forEach(function(key){
            //console.log(key + ' - ' + nextPageKey.query[key]);
            const value = nextPageKey.query[key];
            if (!value){
                delete nextPageKey.query[key];
            }
        });

      }

      const wapper = new MongoWapper(connectionString);
      console.log("nextPageKey", nextPageKey);
      const resultList = await wapper.find(TABLE_NAME, nextPageKey.query, nextPageKey.pageNo, nextPageKey.pageSize, nextPageKey.sort);

      return {
        resultList: resultList,
        pageKey : nextPageKey,
      };
    },

    queryVotedDocumentByCurator : queryVotedDocumentByCurator = async (args) => {

      const pageKey = args.pageKey;
      let nextPageKey = {};
      const pageNo = 1;
      const pageSize = 10;

      if(pageKey){
        nextPageKey = pageKey;
        nextPageKey.pageNo = Number(pageKey.pageNo) + 1;
      } else {
        const accountId = args.accountId;
        nextPageKey = {
          pipeline : [{
            $match: {
              id: accountId
            }
          },
          {
            $lookup: {
              from: TABLE_NAME,
              localField: "documentId",
              foreignField: "documentId",
              as: "documentInfo"
            }
          }]
        }
      }

      const wapper = new MongoWapper(connectionString);
      const resultList = await wapper.aggregate(TABLE_NAME_VOTE, nextPageKey.pipeline);

      return {
        resultList: resultList,
        pageKey: nextPageKey
      };
    },

    queryTotalViewCountByToday : queryTotalViewCountByToday = async (date) => {
      const query = {
        date: date
      }
      const wapper = new MongoWapper(connectionString);
      const result = await wapper.findOne(TABLE_NAME_TOTALVIEWCOUNT, query);

      return result;

    },

    putVote : putVote = async (item) => {
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

        const newItem = {
          id: curatorId,
          created: timestamp,
          blockchainTimestamp: blockchainTimestamp,
          documentId: documentId,
          voteAmount: Number(voteAmount),
          ethAccount: ethAccount,
          transactionInfo: transactionInfo
        }
        console.log("new vote", newItem);
        const wapper = new MongoWapper(connectionString);
        return await wapper.insert(TABLE_NAME_VOTE, newItem);
        //return docClient.put(params).promise();
    },

    queryTodayVotedDocumentByCurator : queryTodayVotedDocumentByCurator = async (args) => {
      let key = null;
      if(args.nextPageKey){
          key = args.nextPageKey;
      }
      const accountId = args.accountId;
      const today = new Date();
      const blockchainTimestamp = utils.getBlockchainTimestamp(today);


      const query = {
        curatorId: accountId,
        created: {$gte: blockchainTimestamp}
        
      }
      console.log("mongo queryTodayVotedDocumentByCurator qeury", qeury);

      const wapper = new MongoWapper(connectionString);
      const result = await wapper.findAll("DEV-CA-VOTE-HIST", query);

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

    getFeaturedDocuments : getFeaturedDocuments = async (args) => {

      let params = null;
      let pageNo = 1;
      if(args && args.q){
          params = args.q;
      } else {
        params = {
          state: "CONVERT_COMPLETE",
          "documentId": {$ne : args.documentId }
        }
      }

      let wapper = new MongoWapper(connectionString);
      return await wapper.find(TABLE_NAME, params, 1, 10);
    },
}
