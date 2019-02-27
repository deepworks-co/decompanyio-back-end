'use strict';
const { mongodb, tables } = require('../resources/config.js').APP_PROPERTIES();
const {MongoWapper, utils} = require('decompany-common-utils');

const TABLE_NAME = tables.DOCUMENT;
const TB_SEO_FRIENDLY = tables.SEO_FRIENDLY;
const TABLE_NAME_VOTE = tables.VOTE;
const TABLE_NAME_TOTALVIEWCOUNT = tables.DAILY_TOTALPAGEVIEW;
const TB_TRACKING = tables.TRACKING;
const TB_TRACKING_USER = tables.TRACKING_USER;

const connectionString = mongodb.endpoint;

module.exports = {
    getDocumentById : getDocumentById = async (documentId) => {
      const wapper = new MongoWapper(connectionString);
      let result = null;
      try{
        
        result = await wapper.findOne(TABLE_NAME, {_id: documentId});
        
      } catch (err){
        throw err;
      } finally{
        wapper.close();
      }
      return result;
    },

    getDocumentBySeoTitle : getDocumentBySeoTitle = async (seoTitle) => {
      const wapper = new MongoWapper(connectionString);
      let document = null;//await wapper.findOne(TABLE_NAME, {seoTitle: seoTitle});
      try{
        if(!document){
          document = await wapper.findOne(TB_SEO_FRIENDLY, {_id: seoTitle});
          console.log(TB_SEO_FRIENDLY, document);
          if(document) {
            document = await getDocumentById(document.id);
          }
        }
        return document;
      } catch (err) {
        throw err;
      } finally {
        wapper.close();
      }      
    },

    getFriendlyUrl : getFriendlyUrl = async (seoTitle) => {
      const wapper = new MongoWapper(connectionString);
      return await wapper.findOne(TB_SEO_FRIENDLY, {seoTitle: seoTitle});
    },

    putDocument : putDocument = async (item) => {
      const wapper = new MongoWapper(connectionString);

      try{
        const timestamp = Date.now();
        /* default value */
        const mergedItem = {
          "created": Number(timestamp),
          "state": "NOT_CONVERT",
          "viewCount": 0
        };
        const params = Object.assign(mergedItem, item);
        console.log("Save New Item", params);

        
        const newDoc = await wapper.insert(TABLE_NAME, params);

        await wapper.insert(TB_SEO_FRIENDLY, {
          _: item.seoTitle,
          type: "DOCUMENT",
          id: item.documentId,
          created: Number(timestamp)
        });
        return newDoc;

      } catch(err){
        throw err;
      } finally{
        wapper.close();
      }
        
    },

    queryDocumentList : queryDocumentList = async (args) => {
      
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

      try{
        console.log("query options query :", query, "sort :", sort, "pageNo :", pageNo, "pageSize :", pageSize);
        const resultList = await wapper.find(TABLE_NAME, query, pageNo, pageSize, sort);

        return {
          resultList: resultList,
          pageNo : pageNo
        };
      } catch(err) {
        throw err;
      } finally {
        wapper.close();
      }
      
    },

    queryVotedDocumentByCurator : queryVotedDocumentByCurator = async (args) => {

      const pageNo = args.pageNo;
      const pageSize = 50;
      const accountId = args.accountId;

      const queryPipeline = [{
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

      try{
        const resultList = await wapper.aggregate(TABLE_NAME_VOTE, queryPipeline);

        return {
          resultList: resultList,
          pageNo: pageNo
        };
      }catch(err){
        throw err;
      }finally{
        wapper.close();
      }
      
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
      try{
        return await wapper.find(TABLE_NAME, params, 1, 10);
      } catch (err){
        throw err;
      } finally {
        wapper.close();
      }
      
    },

  putTrackingInfo : putTrackingInfo = async (body) => {
    let wapper = new MongoWapper(connectionString);
    try{
      return await wapper.save(TB_TRACKING, body);
    } catch(err){
      throw err;
    } finally{
      wapper.close();
    }
    
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

    try{
      const result = await wapper.findOne(TB_TRACKING_USER, {
        cid: body.cid, 
        sid: body.sid,
        e: body.e
      });
  
      if(!result){
        return await wapper.save(TB_TRACKING_USER, body);
      }
    } catch(err) {
      throw err;
    } finally{
      wapper.close();
    }
 
  },

  

  getTrackingInfo : getTrackingInfo = async (documentId) => {
    if(!documentId){
      throw new Error("document id is invalid");
    }
    
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
    const wapper = new MongoWapper(connectionString);
    try{
      //console.log(queryPipeline);
      return await wapper.aggregate(TB_TRACKING, queryPipeline);
    }catch(err){
      throw err;
    } finally{
      wapper.close();
    }
    
  },

  getTrackingList : getTrackingList = async (documentId, cid, sid) => {
    if(!documentId || !cid || !sid){
      throw new Error("document id is invalid");
    }

    
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

    const wapper = new MongoWapper(connectionString);
    try{
      console.log(queryPipeline);
      return await wapper.aggregate(TB_TRACKING, queryPipeline);
    } catch(err){
      throw err;
    } finally {
      wapper.close();
    }
    
  },

}
