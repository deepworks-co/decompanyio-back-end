const utils = require('decompany-common-utils');
const { mongodb, tables } = require('../resources/config.js').APP_PROPERTIES();
const MongoWapper = require('decompany-common-utils').MongoWapper;

const TABLE_NAME = tables.DOCUMENT;
const TABLE_NAME_VOTE = tables.VOTE;
const TABLE_NAME_TOTALVIEWCOUNT = tables.DAILY_TOTALPAGEVIEW;
const TB_TRACKING = tables.TRACKING;

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

    queryDocumentList : queryDocumentList = async (args) => {
      console.log("queryDocumentByLatest args", args);
      const pageSize = 50;
      const tag = args.tag;
      const accountId = args.accountId;
   
      const pageNo = isNaN(args.pageNo)?1:Number(args.pageNo);
      
      let query = {
        state: "CONVERT_COMPLETE"
      }

      if(tag){
        query.tags = tag;
      }
      
      if(accountId){
        query.accountId = accountId;
      }
     
      let sort = {};      

      if(args.path && args.path.lastIndexOf("popular")>0){
        sort = {confirmAuthorReward: -1};
      } else if(args.path && args.path.lastIndexOf("featured")>0){
        sort = {confirmVoteAmount: -1};
      } else {
        sort = {created: -1};
      };

      const wapper = new MongoWapper(connectionString);
      console.log("query options query :", query, "sort :", sort, "pageNo :", pageNo, "pageSize :", pageSize);
      const resultList = await wapper.find(TABLE_NAME, query, pageNo, pageSize, sort);

      return {
        resultList: resultList,
        pageNo : pageNo
      };
    },

    queryVotedDocumentByCurator : queryVotedDocumentByCurator = async (args) => {

      const pageNo = args.pageNo;
      const pageSize = 50;
      

      
      const accountId = args.accountId;

      queryPipeline = [{
        $match: {
          id: accountId
        }
      },
      {
        $group:
        {
            _id: {documentId: "$documentId"},
            voteAmount: {$sum: "$voteAmount"},
            documentId : { $first: '$documentId' }
        }
      },
      {
        $lookup: {
          from: TABLE_NAME,
          localField: "documentId",
          foreignField: "documentId",
          as: "documentInfo"
        }
      },
      {
        $unwind: {
          path: "$documentInfo",
          "preserveNullAndEmptyArrays": true
        }
      },
      {
        "$match": {
          "documentInfo": { "$exists": true, "$ne": null }
        }
      }]
      
      

      const wapper = new MongoWapper(connectionString);
      const resultList = await wapper.aggregate(TABLE_NAME_VOTE, queryPipeline);

      return {
        resultList: resultList,
        pageNo: pageNo
      };
    },

    queryTotalViewCountByToday : queryTotalViewCountByToday = async (date) => {
      const query = {
        date: date
      }
      const wapper = new MongoWapper(connectionString);
      const result = await wapper.findOne(TABLE_NAME_TOTALVIEWCOUNT, query);
      console.log("queryTotalViewCountByToday", query, result);
      return result;

    },

    putVote : putVote = async (item) => {
      const timestamp = Date.now();
      const today = new Date(timestamp);

      const blockchainTimestamp = utils.getBlockchainTimestamp(today);

        console.log("Put Vote Item", item, "timestamp", timestamp);

        const curatorId = item.curatorId;
        const voteAmount = item.voteAmount;
        const documentId = item.documentId;
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
      /* not used
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
      */
      return Promise.resolve("success");
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

    putTrackingInfo : putTrackingInfo = async (body) => {
      let wapper = new MongoWapper(connectionString);
      
      return await wapper.save(TB_TRACKING, body);
    },

    getTrackingInfo : getTrackingInfo = async (documentId) => {
      const wapper = new MongoWapper(connectionString);
      queryPipeline = [{
        $match: {
            id: documentId
        }
      },
      {
        $group: {
            _id: {documentId: "$documentId", cid: "$cid",  sid: '$sid' },
            cid : { $first: '$cid' },
            sid : { $first: '$sid' },
            resultList: { $addToSet: {id: "$_id", n: "$n", t: "$t", e: "$e", cid: "$cid", sid: "$sid"} },
        }
      },
      {
        $sort: {t: 1}
      }]

      
      return await wapper.aggregate(TB_TRACKING, queryPipeline);
    },
}
