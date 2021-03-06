'use strict';
const { mongodb, tables, constants, applicationConfig } = require('decompany-app-properties');
const { MongoWrapper, utils } = require('decompany-common-utils');

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
const WRAPPER = new MongoWrapper(connectionString);
module.exports = {
  WRAPPER,
  getDocumentById,
  getDocumentBySeoTitle,
  getUser,
  queryDocumentList,
  getFriendlyUrl,
  putDocument,
  updateDocument,
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
  checkRegistrableDocument
}

 /**
  * @param  {} documentId
  */
 async function getDocumentById(documentId) {
  
  try{     

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
        $lookup: {
          from: tables.EVENT_REGISTRY,
          localField: "_id",
          foreignField: "documentId",
          as: "registryAs"
        }
      }, {
        $addFields: {
          author: { $arrayElemAt: [ "$userAs", 0 ] },
          featured: { $arrayElemAt: [ "$featuredAs", 0 ] },
          popular: { $arrayElemAt: [ "$popularAs", 0 ] },
          registry: { $arrayElemAt: [ "$registryAs", 0 ] }
        }
      }, {
        $addFields: {
          latestPageview: "$popular.latestPageview",
          latestPageviewList: "$popular.latestPageviewList",
          latestVoteAmount: {$toString: "$featured.latestVoteAmount"},
          isRegistry: {
            $cond: [
              { $ifNull: [ '$registry', false ]}, true, false
            ]
          }
        }
      }, {
        $project: {
          userAs: 0, featuredAs: 0, popularAs: 0, popular: 0, featured: 0, registryAs: 0, registry: 0
          
        }
      }
    ]
    //console.log(JSON.stringify(queryPipeline));
    const documents = await WRAPPER.aggregate(tables.DOCUMENT, queryPipeline);
    
    return documents[0];
  } catch (err) {
    throw err;
  }      
}
 /**
  * @param  {} seoTitle
  */
 async function getDocumentBySeoTitle(seoTitle) {
  //const wapper = new MongoWapper(connectionString);
  
  try{
    
    let document = await WRAPPER.findOne(TB_DOCUMENT, {seoTitle: seoTitle});
    let documentId;
    if(!document){
      const seoFriendly = await WRAPPER.findOne(TB_SEO_FRIENDLY, {_id: seoTitle});
      if(seoFriendly){
        documentId = seoFriendly.id
      } else {
        return;
      }
      
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
        $lookup: {
          from: tables.EVENT_REGISTRY,
          localField: "_id",
          foreignField: "documentId",
          as: "registryAs"
        }
      }, {
        $addFields: {
          author: { $arrayElemAt: [ "$userAs", 0 ] },
          featured: { $arrayElemAt: [ "$featuredAs", 0 ] },
          popular: { $arrayElemAt: [ "$popularAs", 0 ] },
          registry: { $arrayElemAt: [ "$registryAs", 0 ] }
        }
      }, {
        $addFields: {
          latestPageview: "$popular.latestPageview",
          latestPageviewList: "$popular.latestPageviewList",
          latestVoteAmount: {$toString: "$featured.latestVoteAmount"},
          isRegistry: {
            $cond: [
              { $ifNull: [ '$registry', false ]}, true, false
            ]
          }
        }
      }, {
        $project: {
          userAs: 0, featuredAs: 0, popularAs: 0, popular: 0, featured: 0, registryAs: 0, registry: 0
          
        }
      }
    ]
    //console.log(JSON.stringify(queryPipeline));
    document = await WRAPPER.aggregate(tables.DOCUMENT, queryPipeline);
    
    return document[0];
  } catch (err) {
    throw err;
  }     
}

async function getUser(params) {
  //const wapper = new MongoWapper(connectionString);
  try{
    if(typeof params === 'string') {
      return await WRAPPER.findOne(TB_USER, {_id: params});
    } else {
      return await WRAPPER.findOne(TB_USER, params);
    }
    
  } catch (e) {
    throw e
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
  //console.log("queryDocumentListByLatest", params);
  let {tag, accountId, path, pageSize, pageNo, skip} = params;
  pageSize = isNaN(pageSize)?10:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);

  //const wapper = new MongoWapper(connectionString);

  try{
    let pipeline = [{
      $match: { state: "CONVERT_COMPLETE", isDeleted: false, isPublic: true, isBlocked: false }
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
    const totalCount = await WRAPPER.aggregate(tables.DOCUMENT, pipeline.concat([{$count: "totalCount"}]));
    console.log("totalCount", totalCount)

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
      $lookup: {
        from: tables.EVENT_REGISTRY,
        localField: "_id",
        foreignField: "documentId",
        as: "registryAs"
      }
    }, {
      $project: {
        _id: 1, title: 1, created: 1, documentId: 1, documentName: 1, seoTitle: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, seoTitle: 1, cc: 1, shortUrl: 1,
        popular: { $arrayElemAt: [ "$popularAs", 0 ] }, featured: { $arrayElemAt: [ "$featuredAs", 0 ] }, author: { $arrayElemAt: [ "$userAs", 0 ] },
        registry: { $arrayElemAt: [ "$registryAs", 0 ] },
        dimensions: 1
      }
    }, {
      $addFields: {
        latestVoteAmount: {$toString: "$featured.latestVoteAmount"},
        latestPageview: "$popular.latestPageview",
        latestPageviewList: "$popular.latestPageviewList",
        isRegistry: {
                  $cond: [
                    { $ifNull: [ '$registry', false ]}, true, false
                  ]
                }
      }
    }, {
      $project: {featured: 0, popular: 0, registry: 0}
    }]);


    //console.log("pipeline", JSON.stringify(pipeline));
    const resultList = await WRAPPER.aggregate(tables.DOCUMENT, pipeline);
    return {
      resultList,
      totalCount: totalCount[0]?totalCount[0].totalCount:0
    }
   
  } catch(err) {
    throw err;
  }
  
}

async function queryDocumentListByPopular (params) {
  //console.log("queryDocumentListByPopular", params);
  let {tag, accountId, path, pageSize, pageNo, skip} = params;
  pageSize = isNaN(pageSize)?10:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);

  //const wapper = new MongoWapper(connectionString);

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


    const totalCount = await WRAPPER.aggregate(tables.DOCUMENT_POPULAR, pipeline.concat([{$count: "totalCount"}]));
    console.log("totalCount", totalCount)
  
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
      $lookup: {
        from: 'EVENT-REGISTRY',
        localField: '_id',
        foreignField: 'documentId',
        as: 'registryAs'
      }
    }, {
      $project: {_id: 1, title: 1, created: 1, tags: 1, accountId: 1, desc: 1, latestPageview: 1, latestPageviewList: 1, 
        document: { $arrayElemAt: [ "$documentAs", 0 ] }, featured: { $arrayElemAt: [ "$featuredAs", 0 ] }, author: { $arrayElemAt: [ "$authorAs", 0 ] },
        registry: {
          $arrayElemAt: [
            '$registryAs',
            0
          ]
        }
    }
    }, {
      $addFields: {
        documentId: "$_id",
        author: "$author",
        latestVoteAmount: {$toString: "$featured.latestVoteAmount"},
        totalPages: "$document.totalPageview",
        ethAccount: "$document.ethAccount",
        documentName: "$document.documentName",
        documentSize: "$document.documentSize",
        shortUrl: "$document.shortUrl",
        seoTitle: "$document.seoTitle",
        isDeleted: "$document.isDeleted",
        isPublic: "$document.isPublic",
        cc: "$document.cc",
        isRegistry: {
                  $cond: [
                    { $ifNull: [ '$registry', false ]}, true, false
                  ]
                },
        dimensions: "$document.dimensions"
      }
    }, {
      $project: {featured: 0, document: 0, registry: 0}
    }]);
    //console.log(JSON.stringify(pipeline));
    const resultList = await WRAPPER.aggregate(tables.DOCUMENT_POPULAR, pipeline);
    return {
      resultList,
      totalCount: totalCount[0]?totalCount[0].totalCount:0
    }
   
  } catch(err) {
    throw err;
  }
  
}

async function queryDocumentListByFeatured (params) {
  //console.log("queryDocumentListByFeatured", params);
  let {tag, accountId, path, pageSize, pageNo, skip} = params;
  pageSize = isNaN(pageSize)?10:Number(pageSize); 
  pageNo = isNaN(pageNo)?1:Number(pageNo);
  skip = isNaN(skip)?0:Number(skip);
  //const wapper = new MongoWapper(connectionString);

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
  
    const totalCount = await WRAPPER.aggregate(tables.DOCUMENT_FEATURED, pipeline.concat([{$count: "totalCount"}]));
    console.log("totalCount", totalCount)

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
      $lookup: {
        from: 'EVENT-REGISTRY',
        localField: '_id',
        foreignField: 'documentId',
        as: 'registryAs'
      }
    }, {
      $addFields: {
          author: { $arrayElemAt: [ "$userAs", 0 ] },
          document: { $arrayElemAt: [ "$documentAs", 0 ] },
          popular: { $arrayElemAt: [ "$popularAs", 0 ] },
          registry: {
            $arrayElemAt: [
              '$registryAs',
              0
            ]
          }
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
        shortUrl: "$document.shortUrl",
        latestVoteAmount: {$toString: "$latestVoteAmount"},
        cc: "$document.cc",
        isRegistry: {
          $cond: [
            {
              $ifNull: [
                '$registry',
                false
              ]
            },
            true,
            false
          ]
        },
        dimensions: "$document.dimensions"
      }
    }, {
      $project: {documentAs: 0, popularAs: 0, userAs: 0, document: 0, popular: 0, registry: 0}
    }]);
    //console.log(JSON.stringify(pipeline))
    const resultList = await WRAPPER.aggregate(tables.DOCUMENT_FEATURED, pipeline);

    return {
      resultList,
      totalCount: totalCount[0]?totalCount[0].totalCount:0
    }
   
  } catch(err) {
    throw err;
  } 
  
}


async function getVotedDocumentForAccountId (accountId) {
  
  //const wapper = new MongoWapper(connectionString);

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

    return await WRAPPER.aggregate(tables.DOCUMENT_FEATURED, pipeline);
   
  } catch(err) {
    throw err;
  }
  
}



/**
 * @param  {} seoTitle
 */
async function getFriendlyUrl (seoTitle) {
  //const wapper = new MongoWapper(connectionString);
  return await WRAPPER.findOne(TB_SEO_FRIENDLY, {_id: seoTitle});
}

/**
 * @param  {} item
 */
async function putDocument (item) {
  //const wapper = new MongoWapper(connectionString);

  try{
    const timestamp = Date.now();
    /* default value */
    const mergedItem = {
      "created": Number(timestamp),
      "createdAt": new Date(timestamp),
      "state": "NOT_CONVERT"
    };
    const params = Object.assign(mergedItem, item);
    console.log("Save New Item", params);

    
    const newDoc = await WRAPPER.insert(TB_DOCUMENT, params);

    await WRAPPER.insert(TB_SEO_FRIENDLY, {
      _id: item.seoTitle,
      type: "DOCUMENT",
      id: item.documentId,
      created: Number(timestamp),
      createdAt: new Date(timestamp)
    });
    return newDoc;

  } catch(err){
    console.error(err);
    throw err;
  } 
    
}


/**
 * @param  {} item
 */
async function updateDocument (newDoc) {
  //const wapper = new MongoWapper(connectionString);

  try{

    //console.log("new Doc", newDoc);
    const isSeoTitleUpdated = newDoc.seoTitle?true:false;

    //console.log("isSeoTitleUpdated", isSeoTitleUpdated, newDoc);
 
    const updateResult = await WRAPPER.update(TB_DOCUMENT, {_id: newDoc._id}, {$set: newDoc});
    //console.log("update result", updateResult);
    if(isSeoTitleUpdated){
      const seoTitleResult = await WRAPPER.save(TB_SEO_FRIENDLY, {
        _id: newDoc.seoTitle,
        type: "DOCUMENT",
        id: newDoc._id,
        created: Date.now()
      });
      
      console.log("seoTitle save result", seoTitleResult);
    } else {
      console.log("seo title does not updated");
    }
    const result = await WRAPPER.findOne(TB_DOCUMENT, {_id: newDoc._id});
    return result;

  } catch(err){
    throw err;
  }
    
}



/**
 * @param  {} args
 */
async function queryVotedDocumentByCurator(args) {

  const pageNo = args.pageNo;
  //const applicant = args.applicant;
  const userId = args.userId;
  const startTimestamp = args.startTimestamp?args.startTimestamp:1;
  const pageSize = args.pageSize?args.pageSize: 20
  const skip = ((pageNo - 1) * pageSize);
  const activeRewardVoteDays = args.activeRewardVoteDays?args.activeRewardVoteDays:7;
  const queryPipeline = [{
    $match: {
      userId: userId,
      created: {$gt: startTimestamp}
    }
  }, {
    $sort: {
        created: -1
    }
  }, {
    $group: {
      _id: {
        documentId: '$documentId',
        year: {$year: {$add: [new Date(0), "$created"]}},
        month: {$month: {$add: [new Date(0), "$created"]}},
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$created"]}}
      },
      deposit: {
        $sum: '$deposit'
      },
      documentId: {
        $first: '$documentId'
      },
      created: {
        $last: "$created"
      }
    }
  }, {
    $group: {
      _id: "$_id.documentId",
      deposit: {
        $sum: '$deposit'
      },
      documentId: {
        $first: '$documentId'
      },
      created: {
        $first: "$created"
      },
      depositList: {
        $push: {
          deposit: {$toString: '$deposit'},
          created: "$created",
          year: "$_id.year",
          month: "$_id.month",
          dayOfMonth: "$_id.dayOfMonth"
        }
      }
    }
  }, {
    $sort: {created: -1}
  }, {
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
      shortUrl: "$documentInfo.shortUrl",
      created: "$documentInfo.created",
      dimensions: "$documentInfo.dimensions",
      latestPageview: "$popular.latestPageview",
      latestPageviewList: "$popular.latestPageviewList",
      latestVoteAmount: {$toString: "$featured.latestVoteAmount"},
    }
  }, {
    $project: {
      _id: 1,
      deposit: {$toString: "$deposit"},
      documentId: 1,
      created: 1,
      accountId: 1,
      documentName: 1,
      title: 1,
      seoTitle: 1,
      depositList: 1,
      author: 1,
      desc: 1,
      tags: 1,
      shortUrl: 1,
      dimensions: 1,
      latestVoteAmout: {$toString: "$latestVoteAmount"},
    }
  }]
  
  //const wapper = new MongoWapper(connectionString);

  try{
    //console.log(TB_VOTE, JSON.stringify(queryPipeline));
    const resultList = await WRAPPER.aggregate(TB_VOTE, queryPipeline);

    return {
      resultList: resultList,
      pageNo: pageNo
    };
  }catch(err){
    throw err;
  }
  
}


/**
 * 최근(8일간)의  나의 vote목록 및 해당 문서의 총 vote amount가져오기 
 * @param  {} args
 */
async function queryRecentlyVoteListForApplicant(args) {
  //console.log("queryRecentlyVoteListForApplicant", args);
  //const applicant = args.applicant;
  const userId = args.userId;
  const startTimestamp = args.startTimestamp?args.startTimestamp:1;
  const activeRewardVoteDays = args.activeRewardVoteDays?args.activeRewardVoteDays:7;
  const activeRewardVoteTimestamp = utils.getBlockchainTimestamp(new Date()) - (1000*60*60*24 * activeRewardVoteDays)
  const queryPipeline = [{
    $match: {
      userId: userId,
      created: {$gt: startTimestamp}
    }
  }, {
    $sort: {
      created: -1
    }
  }, {
    $group:{
      _id: "$documentId",
      userId: {$first: "$userId"}
    }
  }, {
    $lookup: {
      from: 'VOTE',
      localField: '_id',
      foreignField: 'documentId',
      as: 'voteAmount'
    }
  }, {
    $unwind: {
      path: '$voteAmount',
      includeArrayIndex: 'voteAmountListIndex',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $match:{
      "voteAmount.created": {$gte: activeRewardVoteTimestamp}
    }
  }, {
    $group: {
      _id: {
        documentId: "$_id", 
        dateMillis: "$voteAmount.dateMillis"
      },
      totalDeposit: {$sum: "$voteAmount.deposit"}
    }
  }, {
    $group: {
      _id: '$_id.documentId',
      latestDepositDailyList: {
        $push: {
          dateMillis: '$_id.dateMillis',
          deposit: {$toString: '$totalDeposit'}
        }
      }
    }
  }]
  
  //const wapper = new MongoWapper(connectionString);

  try{
    //console.log("queryRecentlyVoteListForApplicant querypipeline", TB_VOTE, JSON.stringify(queryPipeline));
    const resultList = await WRAPPER.aggregate(TB_VOTE, queryPipeline);

    return resultList;
  }catch(err){
    throw err;
  }
  
}



/**
 * @param  {} date
 */
async function getRecentlyPageViewTotalCount () {
  //const wapper = new MongoWapper(connectionString);
  const now = new Date();
  const startDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8);
  try{
    let result = await WRAPPER.find(TB_STAT_PAGEVIEW_TOTALCOUNT_DAILY, {
      query: {
        blockchainDate: {$gte: startDate}
      },
      sort: {created : -1 }
    });
    if(!result) {
      result = []
    }
    return result;
  }catch(e){
    throw e;
  }
  

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
  const resultMap = await queryDocumentListByFeatured(params); 
  const resultList = resultMap.resultList;
  return resultList.filter((doc)=>{
    return doc.documentId !== documentId;
  });
}
/**
 * @param  {} body
 */
async function putTrackingInfo (body) {
  //let wapper = new MongoWapper(connectionString);
  try{

    return await WRAPPER.save(TB_TRACKING, body);
  } catch(err){
    throw err;
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

  let queryPipeline = [{
    $match: {
        id: documentId,
        ev: {$in: ["view", "leave"]}
    }
  }, {
    $project: {
      ev: 1,
      id: 1,
      n: 1,
      created: 1,
      cid: 1,
      sid: 1
    }
  }, {
    $group: {
      _id: {cid: "$cid", sid: "$sid" },
      cid: {$first: "$cid"},
      sid: {$first: "$sid"},
      viewTimestamp: {$min: "$created"},
      viewTimestampMax: {$max: '$created'},
      maxPageNo: {$max: "$n"},
      pages: { $addToSet: '$n' }
    }
  }, {
    $addFields: {
      readTimestamp: {
        $subtract: ["$viewTimestampMax", "$viewTimestamp"]
      }
    }
  }]
  
  // 1page 문서의 tracking정보 포함
  if(!include){
    queryPipeline.push({
      $match: {
        maxPageNo: {$gt: 1}
      }
    })
  }
  
  queryPipeline = queryPipeline.concat([{
    $group: {
      _id: {cid: "$_id.cid"},
      cid: {$first: "$_id.cid"},
      count: {$sum: 1},
      viewTimestamp: {$max: "$viewTimestamp"},
      pages: { $addToSet: '$pages' },
      totalReadTimestamp: { $sum: "$readTimestamp" }
    }
  }, {
    $lookup: {
      from: TB_TRACKING_USER,
      localField: "cid",
      foreignField: "cid",
      as: "userAs"
    }
  }, {
    $addFields: {
      user: {
        $arrayElemAt: [ "$userAs", 0 ]
      }
    }
  }]);
  
  if(!anonymous){
    queryPipeline.push({
      $match: {"user._id": {$exists: true}}
    })
  }

  queryPipeline = queryPipeline.concat([
    {
      $addFields: {
        "pages": {
          $reduce: {
            "input": "$pages",
            "initialValue": [],
            "in": { "$setUnion": ["$$value", "$$this"]}
          }
        }
      }
    }, {
      $addFields: {
        readPageCount: {$size: "$pages"}
      }
    }, {
      $sort: {
        viewTimestamp: -1
      }
    }
    
  ])

  //const wapper = new MongoWapper(connectionString);
  try{
    console.log(JSON.stringify(queryPipeline));
    return await WRAPPER.aggregate(TB_TRACKING, queryPipeline);
  }catch(err){
    throw err;
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
      ev: {$in: ["view", "leave"]},
      cid: cid
    }
  }, {
    $sort: {"t": 1}
  }, {
    $group: {
      _id: {year: {$year: {$add: [new Date(0), "$created"]}}, month: {$month: {$add: [new Date(0), "$t"]}}, dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}}, cid: "$cid",  sid: "$sid" },
      sid : { $first: '$sid' },
      viewTimestamp: {$max: "$created"},
      viewTimestampMin: {$min: '$created'},
      viewTracking: { $push: {t: "$created", n: "$n", e: "$e", ev:"$ev", cid: "$cid", sid: "$sid"} },
      viewTrackingCount: {$sum: 1},
      maxPageNo: {$max: "$n"},
      pages: {$addToSet: "$n"}
    }
  }, {
    $sort: {"viewTimestamp": -1}
  }, {
    $addFields: {
      readTimestamp: {
        $subtract: ["$viewTimestamp", "$viewTimestampMin"]
      }
    }
  }]

  if(!include){
    queryPipeline.push({
      $match: {
        maxPageNo: {$gt: 1}
      }
    })
  }

  //const wapper = new MongoWapper(connectionString);
  try{
    //console.log(JSON.stringify(queryPipeline));
    return await WRAPPER.aggregate(TB_TRACKING, queryPipeline);
  } catch(err){
    throw err;
  }

}


async function getTrackingUser(cid) {
  //const wapper = new MongoWapper(connectionString);
  try{
    const users = await WRAPPER.findAll(tables.TRACKING_USER, {cid: cid}, {created: -1}, 1);
    return users[0];
  } catch(err){
    throw err;
  } 
}


/**
 * @description Get Top-Tag
 */
async function getTopTag(t) {
  //const wapper = new MongoWapper(connectionString);
  try{
    let tableName = tables.TOP_TAG;
    if(t==="featured"){
      tableName = tables.TOP_TAG_FEATURED;
    } else if(t === "popular") {
      tableName = tables.TOP_TAG_POPULAR;
    } else {
      tableName = tables.TOP_TAG;
    }
    return await WRAPPER.findAll(tableName, {}, {value: -1}, 1000);
  } catch(err){
    throw err;
  }
}

/**
 * @param  {} documentIds
 * @param  {} start
 * @param  {} end
 */
async function getAnalyticsListDaily(documentIds, start, end) {
  console.log("getAnalyticsListDaily", documentIds, start, end);
  //const wapper = new MongoWapper(connectionString);
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
    //console.log("queryPipeline", JSON.stringify(queryPipeline));
    return await WRAPPER.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
  }
}
/**
 * getAnalyticsListWeekly
 * @param  {} documentIds
 * @param  {} start
 * @param  {} end
 */
async function getAnalyticsListWeekly(documentIds, start, end) {
  //console.log("getAnalyticsListWeekly", documentIds, start, end);
  //const wapper = new MongoWapper(connectionString);
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
    
    return await WRAPPER.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
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
  //const wapper = new MongoWapper(connectionString);
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
    return await WRAPPER.aggregate(tables.STAT_PAGEVIEW_DAILY, queryPipeline);
  } catch(err){
    throw err;
  } 
}


async function getDocumentIdsByUserId(userid, start, end, isWeekly) {
  //const wapper = new MongoWapper(connectionString);

  try{
    const doclist = await WRAPPER.findAll(tables.DOCUMENT, {accountId: userid, state:"CONVERT_COMPLETE"});
    return doclist.map((doc)=>{return doc.documentId});
   
    
  } catch(err){
    throw err;
  }
}

async function putTrackingConfirmSendMail(documentId, email) {
  //const wapper = new MongoWapper(connectionString);
  const now = new Date();
  try{

    await WRAPPER.insert(tables.TRACKING_CONFIRM, {
      email: email,
      documentId: documentId,
      created: now.getTime(),
    });
    return true;  
    
  } catch(err){
    throw err;
  }
}

async function checkTrackingConfirmSendMail(documentId, email, cid, sid) {
  //const wapper = new MongoWapper(connectionString);
  
  try{
    const user = await getUser({email: email});
    if(user){
      //등록된 유저(가입된 유저)이면 가입 메일을 발송하지 않는다.
      console.log("check false: Already joined users", email);
      return false;
    } 

    const now = new Date();
    //1. 24시간 안에 대상에게 메일을 보냈는가? 
    const latestSent = now.getTime() - (1000 * 60 * 60 * 24); 
    const sentInfo = await WRAPPER.find(tables.TRACKING_CONFIRM, {documentId: documentId, email: email, sent:{$gt: latestSent}});

    if(sentInfo && sentInfo.length>0){
      console.log("check false : Emails sent within the last 24 hours", email);
      return false;
    }

    //2. 이미 발송 대상에 있는가??
    const emailstosend = await WRAPPER.findAll(tables.TRACKING_CONFIRM, {documentId: documentId, email: email}, {created: -1}, 1);

    if(emailstosend && emailstosend.length>0){
      if(!emailstosend[0].sent){
        console.log("check false : The email is in the waiting list.", email);
        return false;
      }
    }
    console.log(emailstosend);

    return true; 
    
  } catch(err){
    throw err;
  }
}



/**
 * @param  {} cid
 * @param  {} email
 */
async function putTrackingUser(cid, sid, documentId, email){

  //const wapper = new MongoWapper(connectionString);
  
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
      let trackingUser = await WRAPPER.findOne(TB_TRACKING_USER, {cid: cid, sid: sid, e: email});
      if(!trackingUser){
        trackingUser = await WRAPPER.save(TB_TRACKING_USER, item);
        console.log("tracking target user save", trackingUser);
      }

      return Promise.resolve({trackingUser: trackingUser})
      
    } else {
      return Promise.reject(new Error('cid or email is invalid'))
    }
    
  } catch(err){
    throw err;
  } 

  
}


async function checkRegistrableDocument(accountId){
  const limit = applicationConfig || applicationConfig.privateDocumentCountLimit?applicationConfig.privateDocumentCountLimit:5
  return new Promise(async (resolve, reject)=>{
    //const wapper = new MongoWapper(connectionString);

    WRAPPER.query(TB_DOCUMENT, { state: {$ne: constants.DOCUMENT.STATE.CONVERT_FAIL}, isBlocked: false, isDeleted: false , isPublic: false, accountId: accountId})
    .sort({created:-1}).toArray((err, data)=>{
      if(err) {
        reject(err);
      } else {
        if(data && data.length > (limit-1)){
          resolve({check: false, privateDocumentCount: data.length})
        } else {
          resolve({check: true, privateDocumentCount: data.length})
        }
        
      }

    });

  })
  
  
}
