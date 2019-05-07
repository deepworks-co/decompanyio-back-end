'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils } = require('decompany-common-utils');

const TB_DOCUMENT = tables.DOCUMENT;
const TB_DOCUMENT_POPULAR = tables.DOCUMENT_POPULAR;
const TB_DOCUMENT_FEATURED = tables.DOCUMENT_FEATURED;
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
  getVotedDocumentForAccountId,
  getRecentlyPageViewTotalCount,
  queryRecentlyVoteListForApplicant,
  getFeaturedDocuments,
  putTrackingInfo,
  getTrackingInfo,
  getTrackingList,
  getTrackingUser,
  putTrackingUser,
  putTrackingConfirmSendMail,
  checkTrackingConfirmSendMail,
  getTopTag,
  getAnalyticsListDaily,
  getAnalyticsListWeekly,
  getAnalyticsListMonthly,
  getDocumentIdsByUserId,
  
}

 /**
  * @param  {} documentId
  */
 async function getDocumentById(documentId) {
  const wapper = new MongoWapper(connectionString);
  
  try{
    let result = await wapper.findOne(TB_DOCUMENT, {_id: documentId});

    if(result){
      let featured = await wapper.findOne(tables.DOCUMENT_FEATURED, {_id: documentId});
      let popular = await wapper.findOne(tables.DOCUMENT_POPULAR, {_id: documentId});

      if(featured){
        result.latestVoteAmount = featured.latestVoteAmount;
      } else {
        result.latestVoteAmount = 0;
      }

      if(popular){
        result.latestPageview = popular.latestPageview;
      } else {
        result.latestPageview = 0;
      }
    }
    
    console.log("result", result);

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
  
  try{
    
    let document = await wapper.findOne(TB_DOCUMENT, {seoTitle: seoTitle});
    let documentId;
    if(!document){
      const seoFriendly = await wapper.findOne(TB_SEO_FRIENDLY, {_id: seoTitle});
      documentId = seoFriendly.id
    } else {
      documentId = document._id;
    }
    
    console.log(`seoTitle ${seoTitle} to documentId ${documentId}`);

    const queryPipeline = [
      {
        $match: {_id: documentId}
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
        $addFields: {
          author: { $arrayElemAt: [ "$userAs", 0 ] },
          featured: { $arrayElemAt: [ "$featuredAs", 0 ] },
          popular: { $arrayElemAt: [ "$popularAs", 0 ] }
        }
      }, {
        $addFields: {
          latestPageview: "$popular.latestPageview",
          latestPageviewList: "$popular.latestPageviewList",
          latestVoteAmount: "$featured.latestVoteAmount"
        }
      }, {
        $project: {
          userAs: 0, featuredAs: 0, popularAs: 0, popular: 0, featured: 0
        }
      }
    ]

    document = await wapper.aggregate(tables.DOCUMENT, queryPipeline);
    
    return document[0];
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
        latestPageview: "$popular.latestPageview",
        latestPageviewList: "$popular.latestPageviewList"

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
      $project: {_id: 1, title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, latestPageviewList: 1, document: { $arrayElemAt: [ "$documentAs", 0 ] }, featured: { $arrayElemAt: [ "$featuredAs", 0 ] }, author: { $arrayElemAt: [ "$authorAs", 0 ] }}
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
        latestPageviewList: "$popular.latestPageviewList",
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


async function getVotedDocumentForAccountId (accountId) {
  
  const wapper = new MongoWapper(connectionString);

  try{
    const pipeline = [{
      $match: {accountId: accountId}
    }, {
      $sort:{ latestVoteAmount:-1, created: -1}
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
        latestPageviewList: "$popular.latestPageviewList",
        seoTitle: "$document.seoTitle",
      }
    }, {
      $project: {documentAs: 0, popularAs: 0, userAs: 0, document: 0, popular: 0}
    }];

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
        _id: "$documentId",
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
    $match: {
      "documentInfo": { "$exists": true, "$ne": null }
    }
  }, {
    $skip: skip
  }, {
    $limit: pageSize
  }, {
    $addFields: {
      accountId: "$documentInfo.accountId"
    }
  }, {
    $lookup: {
      from: TB_USER,
      localField: "accountId",
      foreignField: "_id",
      as: "authorAs"
    }
  }, {
    $lookup: {

      from: TB_DOCUMENT_POPULAR,
      localField: "_id",
      foreignField: "_id",
      as: "popularAs"
    }
  }, {
    $lookup: {
      from: TB_DOCUMENT_FEATURED,
      localField: "_id",
      foreignField: "_id",
      as: "featuredAs"
    }
  }, {
    $addFields: {
      author: { $arrayElemAt: [ "$authorAs", 0 ] },
      popular: { $arrayElemAt: [ "$popularAs", 0 ] },
      featured: { $arrayElemAt: [ "$featuredAs", 0 ] }
    }
  }, {
    $addFields: {
      documentName: "$documentInfo.documentName",
      title: "$documentInfo.title",
      seoTitle: "$documentInfo.seoTitle",
      desc: "$documentInfo.desc",
      tags: "$documentInfo.tags",
      seoTitle: "$documentInfo.seoTitle",
      created: "$documentInfo.created",
      latestPageview: "$popular.latestPageview",
      latestPageviewList: "$popular.latestPageviewList",
      latestVoteAmount: "$featured.latestVoteAmount",
    }
  }, {
    $project: {
      documentInfo: 0,
      authorAs: 0,
      popularAs: 0,
      popular: 0
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
 * 최근(8일간)의 vote목록
 * @param  {} args
 */
async function queryRecentlyVoteListForApplicant(args) {

  const applicant = args.applicant;
  const startTimestamp = args.startTimestamp?args.startTimestamp:1;

  const queryPipeline = [{
    $match: {
      applicant: applicant,
      created: {$gt: startTimestamp}
    }
  }, {
    $sort: {
      documentId: 1,
      created: -1
    }
  }, {
    $group:{
      _id: {
        documentId: "$documentId",
        year: {$year: {$add: [new Date(0), "$created"]}}, 
        month: {$month: {$add: [new Date(0), "$created"]}}, 
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$created"]}}
      },
      deposit: {$sum: "$deposit"}
    }
  }, {
    $group:{
      _id: "$_id.documentId",
      depositList: {$addToSet: {year: "$_id.year", month: "$_id.month", dayOfMonth: "$_id.dayOfMonth", deposit: "$deposit", timestamp: {$toLong:{$dateFromString: {dateString: {$concat:[{$toString: "$_id.year"}, "-", {$toString: "$_id.month"}, "-", {$toString: "$_id.dayOfMonth"}]}}}}}}
    }
  }, {
    $lookup: {
      from: TB_DOCUMENT_POPULAR,
      localField: "_id",
      foreignField: "_id",
      as: "popularAs"
    }
  }, {
    $addFields: {
      popular: { $arrayElemAt: [ "$popularAs", 0 ] }
    }
  }, {
    $addFields: {
      latestPageview: "$popular.latestPageview",
      latestPageviewList: "$popular.latestPageviewList",
    }
  }, {
    $project: {
      popularAs: 0
    }
  }]
  
  const wapper = new MongoWapper(connectionString);

  try{
    console.log(TB_VOTE, "querypipeline", JSON.stringify(queryPipeline));
    const resultList = await wapper.aggregate(TB_VOTE, queryPipeline);

    return resultList;
  }catch(err){
    throw err;
  }finally{
    wapper.close();
  }
  
}



/**
 * @param  {} date
 */
async function getRecentlyPageViewTotalCount () {
  const wapper = new MongoWapper(connectionString);
  const now = new Date();
  const startDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8);
  try{
    let result = await wapper.find(TB_STAT_PAGEVIEW_TOTALCOUNT_DAILY, {
      blockchainDate: {$gte: startDate}
    });
    if(!result) {
      result = []
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
async function getTrackingList(documentId, anonymous, include) {
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
      viewTimestamp: {$min: "$t"},
      maxPageNo: {$max: "$n"}
    }
  }]
  
  if(!include){
    queryPipeline.push({
      $match: {
        maxPageNo: {$gt: 1}
      }
    })
  }
  
  queryPipeline.push({
    $group: {
      _id: {cid: "$_id.cid"},
      cid: {$first: "$_id.cid"},
      count: {$sum: 1},
      viewTimestamp: {$max: "$viewTimestamp"}
    }
  });


  queryPipeline.push({
    $lookup: {
      from: TB_TRACKING_USER,
      localField: "cid",
      foreignField: "cid",
      as: "userAs"
    }
  });

  queryPipeline.push({
    $unwind: "$userAs"
  });

  queryPipeline.push({
    $sort: {
      "userAs.created": -1
    }
  });

  queryPipeline.push({
    $group: {
      _id: "$_id",
      user: {$first: "$userAs"},
      cid: {$first: "$cid"},
      viewTimestamp: {$first: "$viewTimestamp"},
      count: {$first: "$count"}
    }
  });

  queryPipeline.push({
    $sort: {
      viewTimestamp: -1
    }
  });
  
  if(!anonymous){
    queryPipeline.push({
      $match: {user: {$exists: true}}
    })
  }


  const wapper = new MongoWapper(connectionString);
  try{
    console.log(JSON.stringify(queryPipeline));
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
async function getTrackingInfo(documentId, cid, include) {
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
      viewTrackingCount: {$sum: 1},
      maxPageNo: {$max: "$n"}
    }
  }, {
    $sort: {"viewTimestamp": -1}
  }]

  if(!include){
    queryPipeline.push({
      $match: {
        maxPageNo: {$gt: 1}
      }
    })
  }

  const wapper = new MongoWapper(connectionString);
  try{
    console.log(JSON.stringify(queryPipeline));
    return await wapper.aggregate(TB_TRACKING, queryPipeline);
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }

}


async function getTrackingUser(cid) {
  const wapper = new MongoWapper(connectionString);
  try{
    const users = await wapper.findAll(tables.TRACKING_USER, {cid: cid}, {created: -1}, 1);
    return users[0];
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
        $and:[{documentId: { $in:documentIds }}, {blockchainDate:{$gte:start}}, {blockchainDate:{$lt:end}} ]
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
        $and:[{documentId: { $in:documentIds }}, {blockchainDate:{$gte:start}}, {blockchainDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {documentId: "$documentId", isoWeek: {$isoWeek: "$blockchainDate"}},
        totalCount: {$sum: "$pageview"},
        start: {$min: "$blockchainDate"},
        end: {$max: "$blockchainDate"},
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
        $and:[{documentId: { $in:documentIds }}, {blockchainDate:{$gte:start}}, {blockchainDate:{$lt:end}} ]
      }
    }, {
      $group: {
        _id: {documentId: "$documentId", year: "$_id.year", month: "$_id.month"},
        totalCount: {$sum: "$pageview"}
      }
    }, {
      $sort:{_id:1 }
    }, { 
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

async function putTrackingConfirmSendMail(documentId, email, result) {
  const wapper = new MongoWapper(connectionString);
  const now = new Date();
  try{

    await wapper.insert(tables.TRACKING_CONFIRM, {
      email: email,
      documentId: documentId,
      sent: now.getTime(),
      created: now.getTime(),
      result: result
    });
    return true;  
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}

async function checkTrackingConfirmSendMail(documentId, email, cid, sid) {
  const wapper = new MongoWapper(connectionString);
  
  try{
    const user = await getUser({email: email});
    if(user){
      //등록된 유저(가입된 유저)이면 가입 메일을 발송하지 않는다.
      return false;
    } 

    const now = new Date();
    const latestSent = now.getTime() - (1000 * 60 * 60 * 24); 

    const sentInfo = await wapper.find(tables.TRACKING_CONFIRM, {documentId: documentId, email: email, sent:{$gt: latestSent}});

    if(sentInfo && sentInfo.length>0){
      return false;
    }

    return true; 
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }
}
/**
 * @param  {} cid
 * @param  {} email
 */
async function putTrackingUser(cid, sid, documentId, email){

  const wapper = new MongoWapper(connectionString);
  
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const dayOfMonth = now.getUTCDate();

  try{
    if(cid && utils.validateEmail(email)){
      const item = {
        cid: cid,
        e: email,
        id: documentId,
        sid: sid,
        created: Date.now()
      }
      const r = await wapper.save(TB_TRACKING_USER, item);
      console.log("tracking target user save", r);
    }
    
  } catch(err){
    throw err;
  } finally {
    wapper.close();
  }

  
}