'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils } = require('decompany-common-utils');

const TB_DOCUMENT = tables.DOCUMENT;
const TB_SEO_FRIENDLY = tables.SEO_FRIENDLY;
const TB_VOTE = tables.VOTE;
const TB_STAT_PAGEVIEW_TOTALCOUNT_DAILY = tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY;
const TB_TRACKING = tables.TRACKING;
const TB_TRACKING_USER = tables.TRACKING_USER;
const TB_USER = tables.USER;

const connectionString = mongodb.endpoint;

module.exports = {
  getDocumentById,
  getDocumentBySeoTitle,
  getUser,
  queryDocumentList,
  getFriendlyUrl,
  putDocument,
  queryVotedDocumentByCurator,
  queryTotalViewCountByToday,
  getFeaturedDocuments,
  putTrackingInfo,
  putTrackingUser,
  getTrackingInfo,
  getTrackingList,
  getTopTag,
  getAnalyticsListDaily,
  getAnalyticsListWeekly,
  getAnalyticsListByUserId
}

 /**
  * @param  {} documentId
  */
 async function getDocumentById(documentId) {
  const wapper = new MongoWapper(connectionString);
  
  try{
    let result = await wapper.findOne(TB_DOCUMENT, {_id: documentId});
    return result;
  } catch (err){
    throw err;
  } finally{
    wapper.close();
  }
  
}
 /**
  * @param  {} seoTitle
  */
 async function getDocumentBySeoTitle(seoTitle) {
  const wapper = new MongoWapper(connectionString);
  let document = await wapper.findOne(TB_DOCUMENT, {seoTitle: seoTitle});
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
}

async function getUser(userid) {
  const wapper = new MongoWapper(connectionString);
  try{
    return await wapper.findOne(TB_USER, {_id: userid});
  } catch (e) {
    throw e
  } finally {
    wapper.close();
  }
}
/**
 * @param  {} args
 */
async function queryDocumentList (params) {
  
  let {tag, accountId, path, pageSize, pageNo} = params;

  pageSize = isNaN(pageSize)?20:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);

  if(path && path.lastIndexOf("popular")>0){
    return await queryDocumentListByPopular(params);
  } else if(path && path.lastIndexOf("featured")>0){
    return await queryDocumentListByFeatured(params);
  } else {
    return await queryDocumentListByLatest(params);
  }

}

async function queryDocumentListByLatest (params) {
  console.log("queryDocumentListByLatest", params);
  let {tag, accountId, path, pageSize, pageNo, skip} = params;
  pageSize = isNaN(pageSize)?10:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);



  const wapper = new MongoWapper(connectionString);

  try{
    let pipeline = [{
      $match: { state: "CONVERT_COMPLETE"}
    },{
      $sort:{ created: -1}
    }];
    
    
    if(tag || accountId){
      const q = {}
      if(tag){
        q.tags = tag;
      }
      if(accountId){
        q.accountId = accountId;
      }

      pipeline.push({ $match: q });
    } 
  
    pipeline = pipeline.concat([{
      $skip: skip
    }, {
      $limit: pageSize
    }, {
      $lookup: {
        from: tables.DOCUMENT_POPULAR,
        localField: "_id",
        foreignField: "_id",
        as: "documentAs"
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accoundId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
      $project: {_id: 1, title: 1, created: 1, documentId: 1, documentName: 1, seoTitle: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, document: { $arrayElemAt: [ "$documentAs", 0 ] }, user: { $arrayElemAt: [ "$userAs", 0 ] }}
    },{
      $project: {_id: 1, title: 1, created: 1, documentId: 1, documentName: 1, seoTitle: 1, tags: 1, accountId: 1, desc: 1, latestPageview: "$document.latestPageview", latestReward: "$document.latestReward", nickname: "$user.nickname", picture: "$user.picture"}
    }]);


    console.log("pipeline", pipeline);
    return await wapper.aggregate(tables.DOCUMENT, pipeline);
   
  } catch(err) {
    throw err;
  } finally {
    wapper.close();
  }
  
}

async function queryDocumentListByPopular (params) {
  console.log("queryDocumentListByPopular", params);
  let {tag, accountId, path, pageSize, pageNo, skip} = params;
  pageSize = isNaN(pageSize)?10:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);

  const wapper = new MongoWapper(connectionString);

  try{
    let pipeline = [];
    pipeline.push({
      $sort:{ latestPageview:-1, created: -1}
    });
    
    if(tag || accountId){
      const q = {}
      if(tag){
        q.tags = tag;
      }
      if(accountId){
        q.accountId = accountId;
      }

      pipeline.push({ $match: q });
    } 
  
    pipeline = pipeline.concat([{
      $skip: skip
    }, {
      $limit: pageSize
    }, {
      $lookup: {
        from: tables.DOCUMENT,
        localField: "_id",
        foreignField: "_id",
        as: "documentAs"
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accoundId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
      $project: {_id: 1, title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, document: { $arrayElemAt: [ "$documentAs", 0 ] }, user: { $arrayElemAt: [ "$userAs", 0 ] }}
    },{
      $project: {_id: 1, title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, "seoTitle": "$document.seoTitle", documentId: "$document.documentId", documentName: "$document.documentName", nickname: "$user.nickname", picture: "$user.picture"}
    }]);


    console.log("pipeline", pipeline);
    return await wapper.aggregate(tables.DOCUMENT_POPULAR, pipeline);
   
  } catch(err) {
    throw err;
  } finally {
    wapper.close();
  }
  
}

async function queryDocumentListByFeatured (params) {
  console.log("queryDocumentListByFeatured", params);
  let {tag, accountId, path, pageSize, pageNo, skip} = params;
  pageSize = isNaN(pageSize)?10:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);

  const wapper = new MongoWapper(connectionString);

  try{
    let pipeline = [];
    pipeline.push({
      $sort:{ latestVoteAmount:-1, created: -1}
    });
    
    if(tag || accountId){
      const q = {}
      if(tag){
        q.tags = tag;
      }
      if(accountId){
        q.accountId = accountId;
      }

      pipeline.push({ $match: q });
    } 
  
    pipeline = pipeline.concat([{
      $skip: skip
    }, {
      $limit: pageSize
    }, {
      $lookup: {
        from: tables.DOCUMENT,
        localField: "_id",
        foreignField: "_id",
        as: "documentAs"
      }
    }, {
      $lookup: {
        from: tables.DOCUMENT_POPULAR,
        localField: "_id",
        foreignField: "_id",
        as: "pageviewAs"
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accoundId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
      $addFields: {
          user: { $arrayElemAt: [ "$userAs", 0 ] },
          document: { $arrayElemAt: [ "$documentAs", 0 ] },
          pageview: { $arrayElemAt: [ "$pageviewAs", 0 ] }
      }
  }, {
      $addFields: {
        documentId: "$_id",
        documentName: "$document.documentName",
        latestPageview: "$pageview.latestPageview",
        userid: "$user._id",
        email: "$user.email",
        name: "$user.name",
        picture: "$user.picture",
      }
  }, {
      $project: {documentAs: 0, userAs: 0, pageviewAs: 0, document: 0, user: 0, pageview: 0}
  }]);


    console.log("pipeline", pipeline);
    return await wapper.aggregate(tables.DOCUMENT_FEATURED, pipeline);
   
  } catch(err) {
    throw err;
  } finally {
    wapper.close();
  }
  
}


/**
 * @param  {} seoTitle
 */
async function getFriendlyUrl (seoTitle) {
  const wapper = new MongoWapper(connectionString);
  return await wapper.findOne(TB_SEO_FRIENDLY, {seoTitle: seoTitle});
}
/**
 * @param  {} item
 */
async function putDocument (item) {
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

    
    const newDoc = await wapper.insert(TB_DOCUMENT, params);

    await wapper.insert(TB_SEO_FRIENDLY, {
      _id: item.seoTitle,
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
    
}


/**
 * @param  {} args
 */
async function queryVotedDocumentByCurator(args) {

  const pageNo = args.pageNo;
  const applicant = args.applicant;
  const startTimestamp = args.startTimestamp?args.startTimestamp:1;

  const queryPipeline = [{
    $match: {
      applicant: applicant,
      created: {$gt: startTimestamp}
    }
  }, {
    $sort: {
        created: -1
    }
  }, {
    $group:
    {
        _id: {documentId: "$documentId"},
        deposit: {$sum: "$deposit"},
        documentId : { $first: '$documentId' }
    }
  },
  {
    $lookup: {
      from: TB_DOCUMENT,
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
    console.log(TB_VOTE, JSON.stringify(queryPipeline));
    const resultList = await wapper.aggregate(TB_VOTE, queryPipeline);

    return {
      resultList: resultList,
      pageNo: pageNo
    };
  }catch(err){
    throw err;
  }finally{
    wapper.close();
  }
  
}


/**
 * @param  {} date
 */
async function queryTotalViewCountByToday (date) {
  const wapper = new MongoWapper(connectionString);
  try{
    let result = await wapper.findOne(TB_STAT_PAGEVIEW_TOTALCOUNT_DAILY, {
      blockchainTimestamp: date
    });
    console.log("queryTotalViewCountByToday", result);
    if(!result) {
      result = {totalPageviewSquare: 0, totalPageview: 0, blockchainTimestamp: date}
    }
    return result;
  }catch(e){
    throw e;
  } finally{
    wapper.close();
  }
  

}
/**
 * @param  {} item
 */
async function putVote (item) {
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
    return await wapper.insert(TB_VOTE, newItem);
    //return docClient.put(params).promise();
}


/**
 * @param  {} args
 */
async function getFeaturedDocuments (args) {

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
    return await wapper.find(TB_DOCUMENT, params, 1, 10);
  } catch (err){
    throw err;
  } finally {
    wapper.close();
  }
  
}
/**
 * @param  {} body
 */
async function putTrackingInfo (body) {
  let wapper = new MongoWapper(connectionString);
  try{

    if(body.cid && body.e){
      const r = await wapper.save(TB_TRACKING_USER, {
        _id: body.cid,
        e: body.e,
        created: Date.now()
      });
      console.log("tracking target user", r);
    }
    
    return await wapper.save(TB_TRACKING, body);
  } catch(err){
    throw err;
  } finally{
    wapper.close();
  }
  
}


/**
 * @param  {} body
 * @property cid
 * @property sid
 * @property e
 * @property created
 */
async function putTrackingUser (body) {
  let wapper = new MongoWapper(connectionString);

  try{
    return await wapper.save(TB_TRACKING_USER, body);
  } catch(err) {
    throw err;
  } finally{
    wapper.close();
  }

}
/**
 * 
 * @param  {} documentId
 */
async function getTrackingList(documentId) {
  if(!documentId){
    throw new Error("document id is invalid");
  }

  const queryPipeline = [{
    $match: {
        id: documentId
    }
  }, {
    $sort: {t: -1}
  }, {
    $group: {
      _id: {cid: "$cid", sid: "$sid" },
      cid: {$first: "$cid"},
      sid: {$first: "$sid"},
      viewTimestamp: {$min: "$t"}
    }
  },{
    $group: {
      _id: {cid: "$_id.cid"},
      cid: {$first: "$_id.cid"},
      count: {$sum: 1},
      viewTimestamp: {$max: "$viewTimestamp"},
      sidList: { $push: "$_id.sid" },
    }
  }, {
    $lookup: {
      from: TB_TRACKING_USER,
      localField: "cid",
      foreignField: "_id",
      as: "user"
    }
  }, {
    $sort: {
      viewTimestamp: -1
    }
  }]

const wapper = new MongoWapper(connectionString);
  try{
    //console.log(queryPipeline);
    return await wapper.aggregate(TB_TRACKING, queryPipeline);
  }catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}
/**
 * @param  {} documentId
 * @param  {} cid
 * @param  {} sid
 */
async function getTrackingInfo(documentId, cid, sid) {
  if(!documentId || !cid ){
    throw new Error("document id or cid is invalid");
  }

  const queryPipeline = [{
    $match: {
      id: documentId, 
      cid: cid
    }
  }, {
    $sort: {"t": 1}
  }, {
    $group: {
      _id: {year: {$year: {$add: [new Date(0), "$t"]}}, month: {$month: {$add: [new Date(0), "$t"]}}, dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}}, cid: "$cid",  sid: "$sid" },
      cid : { $first: '$cid' },
      sid : { $first: '$sid' },
      viewTimestamp: {$max: "$t"},
      viewTracking: { $addToSet: {t: "$t", n: "$n", e: "$e", ev:"$ev", cid: "$cid", sid: "$sid"} },
    }
  },
  {
    $sort: {"viewTimestamp": -1}
  }]

  const wapper = new MongoWapper(connectionString);
  try{
    //console.log(queryPipeline);
    return await wapper.aggregate(TB_TRACKING, queryPipeline);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }

}
/**
 * @description Get Top-Tag
 */
async function getTopTag() {
  const wapper = new MongoWapper(connectionString);
  try{
    return await wapper.findAll(tables.TOP_TAG, {}, {value: -1}, 1000);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}

/**
 * @param  {} documentIds
 * @param  {} start
 * @param  {} end
 */
async function getAnalyticsListDaily(documentIds, start, end) {
  const wapper = new MongoWapper(connectionString);
  try{
    const queryPipeline = [{
      $match: {
        $and:[{documentId: { $in:documentIds }}, {statDate:{$gte:start}}, {statDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {year: "$_id.year", month: "$_id.month", dayOfMonth:"$_id.dayOfMonth"},
        totalCount: {$sum: "$count"}
      }
    }, {
      $sort:{_id:1}
    },{ 
      $project: {
        "_id": 0,
        year: "$_id.year",
        month: "$_id.month",
        dayOfMonth: "$_id.dayOfMonth",
        count: "$totalCount"

      }
    }]
    return await wapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}
/**
 * @param  {} documentIds
 * @param  {} start
 * @param  {} end
 */
async function getAnalyticsListWeekly(documentIds, start, end) {
  const wapper = new MongoWapper(connectionString);
  try{
    const queryPipeline = [{
      $match: {
        $and:[{documentId: { $in:documentIds }}, {statDate:{$gte:start}}, {statDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {$isoWeek: "$statDate"},
        totalCount: {$sum: "$count"},
        start: {$min: "$statDate"},
        end: {$max: "$statDate"},
      }
    }, {
      $sort:{_id:1}
    },{ 
      $project: {
        "_id": 0,
        week: "$_id",
        count: "$totalCount",
        start: 1,
        end:1

      }
    }]
    return await wapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}


async function getAnalyticsListByUserId(userid, start, end, isWeekly) {
  const wapper = new MongoWapper(connectionString);

  try{

    const doclist = await wapper.findAll(tables.DOCUMENT, {accountId: userid, state:"CONVERT_COMPLETE"});
    
    const documentIds = doclist.map((doc)=>{return doc.documentId});
    //console.log(documentIds);
    if(isWeekly){
      return await getAnalyticsListWeekly(documentIds, start, end);
    } else {
      return await getAnalyticsListDaily(documentIds, start, end);
    }
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}