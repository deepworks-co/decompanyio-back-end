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
  saveDocument,
  queryVotedDocumentByCurator,
  queryTotalViewCountByToday,
  getFeaturedDocuments,
  putTrackingInfo,
  getTrackingInfo,
  getTrackingList,
  getTopTag,
  getAnalyticsListDaily,
  getAnalyticsListWeekly,
  getAnalyticsListMonthly,
  getDocumentIdsByUserId
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
      const seoFriendly = await wapper.findOne(TB_SEO_FRIENDLY, {_id: seoTitle});
      console.log(TB_SEO_FRIENDLY, seoFriendly);
      if(seoFriendly) {
        document = await getDocumentById(seoFriendly.id);
      }
    }
    return document;
  } catch (err) {
    throw err;
  } finally {
    wapper.close();
  }      
}

async function getUser(params) {
  const wapper = new MongoWapper(connectionString);
  try{
    if(typeof params === 'string') {
      return await wapper.findOne(TB_USER, {_id: params});
    } else {
      return await wapper.findOne(TB_USER, params);
    }
    
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
  
  if(path && path.lastIndexOf("popular")>-1){
    return await queryDocumentListByPopular(params);
  } else if(path && path.lastIndexOf("featured")>-1){
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
        as: "popularAs"
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accountId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
      $lookup: {
        from: tables.DOCUMENT_FEATURED,
        localField: "_id",
        foreignField: "_id",
        as: "featuredAs"
      }
    }, {
      $project: {_id: 1, title: 1, created: 1, documentId: 1, documentName: 1, seoTitle: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, seoTitle: 1,   popular: { $arrayElemAt: [ "$popularAs", 0 ] }, featured: { $arrayElemAt: [ "$featuredAs", 0 ] }, author: { $arrayElemAt: [ "$userAs", 0 ] }}
    }, {
      $addFields: {
        latestVoteAmount: "$featured.latestVoteAmount",
        latestPageview: "$popular.latestPageview"

      }
    }, {
      $project: {featured: 0, popular: 0}
    }]);


    //console.log("pipeline", pipeline);
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
        from: tables.DOCUMENT_FEATURED,
        localField: "_id",
        foreignField: "_id",
        as: "featuredAs"
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accountId",
        foreignField: "_id",
        as: "authorAs"
      }
    }, {
      $project: {_id: 1, title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, document: { $arrayElemAt: [ "$documentAs", 0 ] }, featured: { $arrayElemAt: [ "$featuredAs", 0 ] }, author: { $arrayElemAt: [ "$authorAs", 0 ] }}
    }, {
      $addFields: {
        documentId: "$_id",
        author: "$author",
        latestVoteAmount: "$featured.latestVoteAmount",
        totalPages: "$document.totalPageview",
        ethAccount: "$document.ethAccount",
        documentName: "$document.documentName",
        documentSize: "$document.documentSize",
        seoTitle: "$document.seoTitle",
      }
    }, {
      $project: {featured: 0, document: 0}
    }]);

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
  skip = isNaN(skip)?0:Number(skip);
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
        as: "popularAs"
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accountId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
      $addFields: {
          author: { $arrayElemAt: [ "$userAs", 0 ] },
          document: { $arrayElemAt: [ "$documentAs", 0 ] },
          popular: { $arrayElemAt: [ "$popularAs", 0 ] }
      }
    }, {
      $addFields: {
        documentId: "$_id",
        documentName: "$document.documentName",
        documentSize: "$document.documentSize",
        totalPageview: "$document.totalPageview",
        ethAccount: "$document.ethAccount",
        latestPageview: "$popular.latestPageview",
        seoTitle: "$document.seoTitle",
      }
    }, {
      $project: {documentAs: 0, popularAs: 0, userAs: 0, document: 0, popular: 0}
    }]);

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
 * @param  {} item
 */
async function saveDocument (newDoc) {
  const wapper = new MongoWapper(connectionString);

  try{
    const timestamp = Date.now();
    const oldDoc = await wapper.findOne(TB_DOCUMENT, {_id: newDoc._id});
    console.log("old document", oldDoc);
    console.log("new document", newDoc);
    const mergedItem = Object.assign(oldDoc, newDoc);    
    console.log("merged document", mergedItem);
    
    const result = await wapper.save(TB_DOCUMENT, mergedItem);

    await wapper.insert(TB_SEO_FRIENDLY, {
      _id: mergedItem.seoTitle,
      type: "DOCUMENT",
      id: mergedItem._id,
      created: Number(timestamp)
    });

    return result;

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
  const pageSize = args.pageSize?args.pageSize: 20
  const skip = ((pageNo - 1) * pageSize);

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
      foreignField: "_id",
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
  }, {
    $skip: skip
  }, {
    $limit: pageSize
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

  const {documentId, tags} = args;
  const params = {
    pageNo: 1,
    pageSize: 10,
    tag: tags
  }
  const resultList = await queryDocumentListByFeatured(params); 

  return resultList.filter((doc)=>{
    return doc.documentId !== documentId;
  });
}
/**
 * @param  {} body
 */
async function putTrackingInfo (body) {
  let wapper = new MongoWapper(connectionString);
  try{

    if(body.cid && body.e && utils.validateEmail(body.e)){

      const r = await wapper.save(TB_TRACKING_USER, {
        _id: {
          cid: body.cid,
          e: body.e
        },
        cid: body.cid,
        e: body.e,
        id: body.id,
        sid: body.sid,
        created: Date.now()
      });
      console.log("tracking target user save", r);
    }
    
    return await wapper.save(TB_TRACKING, body);
  } catch(err){
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
  }, {
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
      foreignField: "cid",
      as: "user"
    }
  }, {
    $sort: {
      viewTimestamp: -1
    }
  }, {
    $project: {
      cid: 1,
      count: 1,
      viewTimestamp: 1,
      sidList: 1,
      userKey: 1
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
async function getTrackingInfo(documentId, cid, sid, include) {
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
      viewTrackingCount: {$sum: 1}
    }
  }, {
    $sort: {"viewTimestamp": -1}
  }]

  if(!include){
    console.log("excluding 1 page view");
    queryPipeline.push({
      $match: {
        viewTrackingCount: {$gt: 2}
      }
    })
  } else {
    console.log("include 1 page view");
  }

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
  console.log("getAnalyticsListDaily", documentIds, start, end);
  const wapper = new MongoWapper(connectionString);
  try{
    const queryPipeline = [{
      $match: {
        $and:[{documentId: { $in:documentIds }}, {statDate:{$gte:start}}, {statDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {documentId: "$documentId", year: "$_id.year", month: "$_id.month", dayOfMonth:"$_id.dayOfMonth"},
        totalCount: {$sum: "$pageview"}
      }
    }, {
      $sort:{_id:1 }
    },{ 
      $project: {
        "_id": 0,
        year: "$_id.year",
        month: "$_id.month",
        dayOfMonth: "$_id.dayOfMonth",
        documentId: "$_id.documentId",
        count: "$totalCount"

      }
    }]
    console.log("queryPipeline", JSON.stringify(queryPipeline));
    return await wapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}
/**
 * getAnalyticsListWeekly
 * @param  {} documentIds
 * @param  {} start
 * @param  {} end
 */
async function getAnalyticsListWeekly(documentIds, start, end) {
  console.log("getAnalyticsListWeekly", documentIds, start, end);
  const wapper = new MongoWapper(connectionString);
  try{
    const queryPipeline = [{
      $match: {
        $and:[{documentId: { $in:documentIds }}, {statDate:{$gte:start}}, {statDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {documentId: "$documentId", isoWeek: {$isoWeek: "$statDate"}},
        totalCount: {$sum: "$pageview"},
        start: {$min: "$statDate"},
        end: {$max: "$statDate"},
      }
    }, {
      $sort:{_id:1}
    },{ 
      $project: {
        "_id": 0,
        week: "$_id.isoWeek",
        documentId: "$_id.documentId",
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

/**
 * getAnalyticsListMonthly
 * @param  {} documentIds
 * @param  {} start
 * @param  {} end
 */
async function getAnalyticsListMonthly(documentIds, start, end) {
  console.log("getAnalyticsListMonthly", documentIds, start, end);
  const wapper = new MongoWapper(connectionString);
  try{
    const queryPipeline = [{
      $match: {
        $and:[{documentId: { $in:documentIds }}, {statDate:{$gte:start}}, {statDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {documentId: "$documentId", year: "$_id.year", month: "$_id.month"},
        totalCount: {$sum: "$pageview"}
      }
    }, {
      $sort:{_id:1 }
    },{ 
      $project: {
        "_id": 0,
        year: "$_id.year",
        month: "$_id.month",
        documentId: "$_id.documentId",
        count: "$totalCount"

      }
    }]
    console.log("queryPipeline", JSON.stringify(queryPipeline));
    return await wapper.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}


async function getDocumentIdsByUserId(userid, start, end, isWeekly) {
  const wapper = new MongoWapper(connectionString);

  try{
    const doclist = await wapper.findAll(tables.DOCUMENT, {accountId: userid, state:"CONVERT_COMPLETE"});
    return doclist.map((doc)=>{return doc.documentId});
   
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}