'use strict';
const {utils, MongoWrapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('decompany-app-properties');

module.exports.handler = async (event, context, callback) => {
  console.log(event);
  const {year, month, dayOfMonth} = event;
  

  const wrapper = new MongoWrapper(mongodb.endpoint);
  
  try{
    const rewardPool = await getRewardPool(wrapper,  {year, month, dayOfMonth});
    console.log("rewardPool", rewardPool);
    const rewardPoolOfDay = rewardPool.creatorRewaryDaily;
    const resultList = await getPageviewOfRegisteredDocument(wrapper, {"_id.year": year, "_id.month": month, "_id.dayOfMonth": dayOfMonth});
    const totalPageview = await getToalPageviewOfRegisteredDocument(wrapper,  {"_id.year": year, "_id.month": month, "_id.dayOfMonth": dayOfMonth})
    
    const saveResult = await saveDailyCreatorRoyalty(wrapper, resultList, rewardPoolOfDay, totalPageview);
    console.log("staveResult", totalPageview)
  }catch(err){
    console.error(err);
  }finally{
    wrapper.close();
  }

  return {success: true}
};
function saveDailyCreatorRoyalty(wrapper, resultList, rewardPoolOfDay, totalPageview){
  return new Promise(async (resolve, reject)=>{

    const bulk = wrapper.getUnorderedBulkOp(tables.DAILY_ADJUSTMENT_ROYALTY);

    resultList.forEach((pageviewOfDoc)=>{
      console.log(pageviewOfDoc.documentId, totalPageview, rewardPoolOfDay);
      const reward = (pageviewOfDoc.pageview / totalPageview.totalPageview)  * (rewardPoolOfDay * 0.7);

      console.log(pageviewOfDoc.documentId, totalPageview._id, `total pageview: ${totalPageview.totalPageview}`,`pageview : ${pageviewOfDoc.pageview}`,`reward : ${reward}`);
      const item = {
        _id: {
          year: year,
          month: month,
          dayOfMonth: dayOfMonth,
          id: pageviewOfDoc.documentId
        },
        reward: reward,
        created: Date.now()
      }
      bulk.find({_id: item._id}).upsert().updateOne(item);
    });

    const bulkResult = await wrapper.execute(bulk); 

    console.log("bulk result", bulkResult);

    resolve({success: true, bulkResult})
  })
}
function getRewardPool(wrapper, {year, month, dayOfMonth}){
  const date = new Date(Date.UTC(year, month, dayOfMonth));
  console.log("date", date.getTime());
  return new Promise((resolve, reject)=>{
    wrapper.find(tables.REWARD_POOL, {
      query: {
        use: true
      }
    }).then((data)=>{
      if(data && data.length>0){
        resolve(data[0]);
      } else {
        reject("reward is empty")
      }
      
    }).catch((err)=>{
      reject(err);
    })
  })
}
function getPageviewOfRegisteredDocument(wrapper, query){
  return new Promise((resolve, reject)=>{
    wrapper.aggregate(tables.STAT_PAGEVIEW_DAILY, [
      {
        $match: query
      }, {
        $lookup: {
          'from': tables.DOCUMENT, 
          'foreignField': '_id', 
          'localField': '_id.id', 
          'as': 'document'
        }
      }, {
        $unwind: {
          'path': '$document'
        }
      }, {
        $match: {
          'document.registry': {$exists: true}
        }
      }
    ]).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    });

  })
}

function getToalPageviewOfRegisteredDocument(wrapper, query){
  return new Promise((resolve, reject)=>{
    wrapper.aggregate(tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY, [
      {
        $match: query
      }
    ]).then((data)=>{
      resolve(data[0]);
    }).catch((err)=>{
      reject(err);
    });

  })
}