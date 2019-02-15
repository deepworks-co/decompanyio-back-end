const utils = require('decompany-common-utils');
const { mongodb, tables } = require('../resources/config.js').APP_PROPERTIES();
const MongoWapper = require('decompany-common-utils').MongoWapper;

const TABLE_NAME = tables.DOCUMENT;
const TABLE_NAME_VOTE = tables.VOTE;
const TABLE_NAME_TOTALVIEWCOUNT = tables.DAILY_TOTALPAGEVIEW;
const TB_TRACKING = tables.TRACKING;
const TB_TRACKING_USER = tables.TRACKING_USER;

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


  /**
   * @param  {} body
   * @property cid
   * @property sid
   * @property e
   * @property created
   */
  putTrackingUser : putTrackingUser = async (body) => {
    let wapper = new MongoWapper(connectionString);

    const result = await wapper.findOne(TB_TRACKING_USER, {
      cid: body.cid, 
      sid: body.sid,
      e: body.e
    });

    if(!result){
      return await wapper.save(TB_TRACKING_USER, body);
    }
    
    return null;    
  },

  

  getTrackingInfo : getTrackingInfo = async (documentId) => {
    if(!documentId){
      throw new Error("document id is invalid");
    }
    const wapper = new MongoWapper(connectionString);
    queryPipeline = [{
        $match: {
            id: documentId
        }
      },
      {
        $group: {
          _id: {year: {$year: {$add: [new Date(0), "$t"]}}, month: {$month: {$add: [new Date(0), "$t"]}}, dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}}, cid: "$cid",  sid: "$sid" },
          count: {$sum: 1},
          latest: {$min: "$t"},
          cid: {$first: "$cid"},
          sid: {$first: "$sid"},
          e: {$first: "$e"},
          viewingPages: {$addToSet: "$n"}
        }
      },
      {
          $sort: {"latest": -1}
      }
    ]

    //console.log(queryPipeline);
    return await wapper.aggregate(TB_TRACKING, queryPipeline);
  },

  getTrackingList : getTrackingList = async (documentId, cid, sid) => {
    if(!documentId || !cid || !sid){
      throw new Error("document id is invalid");
    }

    const wapper = new MongoWapper(connectionString);
    queryPipeline = [
      {
        $match: {
          id: documentId, 
          cid: cid,
          sid: sid
        }
      },
      {
        $sort: {"t": 1}
      },
      {
          $group: {
            _id: {year: {$year: {$add: [new Date(0), "$t"]}}, month: {$month: {$add: [new Date(0), "$t"]}}, dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}}, cid: "$cid",  sid: "$sid" },
            cid : { $first: '$cid' },
            sid : { $first: '$sid' },
            latest: {$min: "$t"},
            resultList: { $addToSet: {t: "$t", n: "$n", e: "$e", ev:"$ev", cid: "$cid", sid: "$sid"} },
          }
      },
      {
        $sort: {"latest": -1}
      }
    ]
    console.log(queryPipeline);
    return await wapper.aggregate(TB_TRACKING, queryPipeline);
  },

}
