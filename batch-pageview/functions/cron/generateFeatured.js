'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig, applicationConfig} = require('decompany-app-properties');

const TB_DOCUMENT = tables.DOCUMENT;
const period = applicationConfig.activeVoteDays;
/**
 * @description 
 * 1시간마다 전체 문서의 VoteAmount를 가져오기 위한 SQS생성함
 * 
 */
module.exports.handler = async (event, context, callback) => {
  const now = new Date();
  const beforeDays = new Date(now - 1000 * 60 * 60 * 24 * period);  //30일

  console.log("Query period", beforeDays, "(include) between (exclude)", now);

  const wapper = new MongoWapper(mongodb.endpoint);

  try{
    const queryPipeline = getQueryPipeline(beforeDays.getTime(), tables.DOCUMENT_FEATURED);
    const resultList = await wapper.aggregate(tables.VOTE, queryPipeline, {
      allowDiskUse: true
    });
    console.log("queryPipeline", JSON.stringify(queryPipeline));
    console.log(resultList);
    console.log("count", resultList.length);
  } catch(e){
    console.log(e);
  } finally {
    wapper.close();
  }

  return (null, "success");
  
};

function getQueryPipeline(startTimestamp, targetCollection){
  return [{
      $match: {
          "created": {$gte: startTimestamp}
      }
  }, {
      $group: {
          "_id": "$documentId",
          "latestVoteAmount":{$sum:"$deposit"},
          "documentId": {$first:"$documentId"},
          "latestVoteAmountUpdated": {$max:"$created"}
      }
  },
  {
      $lookup: {
          from: tables.DOCUMENT,
          localField: "documentId",
          foreignField:"documentId",
          as: "documentInfo"
      }
  }, {
    $addFields: {
      "documentInfo": {
        "$arrayElemAt": [
            {
                "$filter": {
                    "input": "$documentInfo",
                    "as": "doc",
                    "cond": {
                        $and: [
                          {"$eq": [ "$$doc.isPublic", true]},
                          {"$eq": [ "$$doc.isDeleted", false]},
                          {"$eq": [ "$$doc.isBlocked", false]},
                        ]
                    }
                }
            }, 0
        ]
      }
    }
  }, {
      $unwind: {
          path:"$documentInfo",
          preserveNullAndEmptyArrays: false
      }
  }, {
      $addFields: {
          tags: "$documentInfo.tags",
          desc: "$documentInfo.desc",
          seoTitle: "$documentInfo.seoTitle",
          title: "$documentInfo.title",
          accountId: "$documentInfo.accountId",
          created: "$documentInfo.created",
          latestVoteAmountDate: {$add: [new Date(0), "$latestVoteAmountUpdated"]}
      }
  }, {
    $project: {
      documentInfo:0
    }
  }, {
    $out: targetCollection
  }];
}