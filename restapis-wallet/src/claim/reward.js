'use strict';
const {stage, mongodb, tables, region, walletConfig, applicationConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper, utils} = require("decompany-common-utils");
const Web3 = require('web3');
const BigNumber = require('bignumber.js');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);
const ACTIVE_VOTE_DAYS = applicationConfig.activeRewardVoteDays;

module.exports.handler = async (event) => {

  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }


  const {principalId, body} = event;
  const {documentId} = body;

  try{

    const doc = await getDocument(documentId);

    if(!doc){
      throw new Error(`${documentId} is not registry!`);
    }

    if(doc.accountId !== principalId){
      throw new Error(`You are not the owner of the document. : ${doc.title}`);
    }
    const lastClaim = await getLastClaimReward({
      documentId: documentId,
      userId: principalId
    });
    
    const start = lastClaim&&lastClaim._id&&lastClaim._id.blockchainTimestamp?utils.getDate(new Date(lastClaim._id.blockchainTimestamp), 1):new Date(0); //마지막 claim에서 다음날부터 claim요청함
    const end = new Date(utils.getBlockchainTimestamp(utils.getDate(new Date(), -1 * (ACTIVE_VOTE_DAYS - 1))));
    console.log("vote reward start, end", start, end);

    const rewardPool = await getRewardPool();
    
    const dailyMyVoteMatrix = await getDailyMyVoteMatrix(documentId, principalId, utils.getBlockchainTimestamp(start), utils.getBlockchainTimestamp(end), rewardPool);
    //console.log("dailyMyVoteMatrix", JSON.stringify(dailyMyVoteMatrix));
    console.log("totalVoteAmount query period", utils.getDate(start, ACTIVE_VOTE_DAYS * -1), utils.getDate(end, ACTIVE_VOTE_DAYS))
    const dailyVoteMap = await getDailyVoteMap(documentId, utils.getBlockchainTimestamp(utils.getDate(start, ACTIVE_VOTE_DAYS * -1)), utils.getBlockchainTimestamp(utils.getDate(end, ACTIVE_VOTE_DAYS)));
    //console.log("dailyVoteMap", JSON.stringify(dailyVoteMap))

    console.log("pageview query period", utils.getDate(start, ACTIVE_VOTE_DAYS * -1), utils.getDate(end, ACTIVE_VOTE_DAYS))
    const dailyPageviewMap = await getDailyPageviewMap(documentId, utils.getBlockchainTimestamp(utils.getDate(start, ACTIVE_VOTE_DAYS * -1)), utils.getBlockchainTimestamp(utils.getDate(end, ACTIVE_VOTE_DAYS)));
    //console.log("dailyPageviewMap", JSON.stringify(dailyPageviewMap));
    
    const curatorRewards = await calcRewardMatrix({
      dailyMyVoteMatrix,
      dailyPageviewMap,
      dailyVoteMap
    })
    
    //console.log("curatorRewards", JSON.stringify(curatorRewards));  

    const saveResults = await saveCuratorRewards({
      documentId, 
      userId: principalId, 
      curatorRewards
    }); 
    
    //console.log('saveResults', JSON.stringify(saveResults))

    return JSON.stringify({
      success: true,
      rewards: saveResults.map((it)=>{
        return {
          id: it.claimReward._id,
          voteDate: it.claimReward.voteDate,
          value: web3.utils.fromWei(it.value.toString(), "ether")
          
        }
      })
    })
    
   
  } catch (err){
    console.error(err);
    throw new Error(`[500] ${err.toString()}`);
  }

};

function getDocument(documentId){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

/**
 * 
 * @param {*} documentId 
 * @param {*} startTimestamp 
 * @param {*} endTimestamp 
 */
async function getDailyVoteMap(documentId, startTimestamp, endTimestamp){
  
  const voteList = await mongo.aggregate(tables.VOTE, [{
      $match: {
        blockchainTimestamp: {$gte: startTimestamp, $lt: endTimestamp}
      }
    }, {
        $group: {
            _id: "$blockchainTimestamp",
            voteAmount: {
                $sum: "$deposit"
            }
        }
    }])
  
  
  const totalVoteMatrix = voteList.map((voteInfo)=>{
    const voteDate = new Date(voteInfo._id);
    return Array(ACTIVE_VOTE_DAYS).fill(0).map((it, index)=>{
      const activeDate = utils.getDate(voteDate, index);
      
      return {
        activeTimestamp: utils.getBlockchainTimestamp(activeDate),
        voteDate,
        activeDate,
        voteAmount: voteInfo.voteAmount
      }
      
    })

  })

  
  const voteMap = {};
  const etherUnit = new BigNumber('1000000000000000000');
  totalVoteMatrix.forEach((activeVoteList)=>{
    activeVoteList.forEach((activeVoteInfo)=>{
      const big = new BigNumber(activeVoteInfo.voteAmount.toString()).dividedBy(etherUnit)
      if(voteMap[activeVoteInfo.activeTimestamp]){
        voteMap[activeVoteInfo.activeTimestamp] = voteMap[activeVoteInfo.activeTimestamp].plus( big );
      } else {
        voteMap[activeVoteInfo.activeTimestamp] = big
      }
    })
  })

  return voteMap;

}

function getDailyMyVoteMatrix(documentId, userId, startTimestamp, endTimestamp, rewardPool){
  
  return new Promise((resolve, reject)=>{

    mongo.aggregate(tables.VOTE, [
      {
        $match: {
          documentId: documentId,
          userId: userId,
          $and: [
            {blockchainTimestamp: {$gte: startTimestamp}}, 
            {blockchainTimestamp: {$lt: endTimestamp}}
          ]
        }
      }, {
        $group: {
          _id: '$blockchainTimestamp', 
          voteAmount: {
            '$sum': '$deposit'
          }
        }
      }, {
        $sort: {
          _id: 1
        }
      }
    ]).then((data)=>{
      
      const endDate = utils.getBlockchainTimestamp(new Date());

      const matrix = data.filter(it=>{
        const startVoteDate = new Date(it._id);
        return startVoteDate < endDate;
      }).map((voteInfo)=>{
        
        const voteDate = new Date(voteInfo._id);
        
        return Array(ACTIVE_VOTE_DAYS).fill(0).map((it, index)=>{
          const activeDate = utils.getDate(voteDate, index);

          if(activeDate < endDate){
            return {
              voteDate,
              activeDate,
              voteAmount: web3.utils.fromWei(voteInfo.voteAmount.toString(), "ether"),
              rewardPoolInfo: rewardPool.find((pool)=>{
                const {start, end} = pool;
                return (activeDate.getTime()>=start.getTime() && activeDate.getTime()<end.getTime())
              })
            }

          }
          return null;
          
        }).filter((it)=>{
          return it?true:false
        })
      })
    
      resolve(matrix);
      //resolve(data);
    }).catch((err)=>{
      reject(err);
    })
  })
}

async function getDailyPageviewMap(documentId, startTimestamp, endTimestamp){

  const pageviewList = await mongo.aggregate(tables.STAT_PAGEVIEW_DAILY, [
    {
      '$match': {
        'documentId': documentId, 
        '$and': [
          {
            'blockchainTimestamp': {
              '$gte': startTimestamp
            }
          }, {
            'blockchainTimestamp': {
              '$lt': endTimestamp
            }
          }
        ]
      }
    }, {
      '$lookup': {
        'from': tables.STAT_PAGEVIEW_TOTALCOUNT_DAILY, 
        'localField': 'blockchainTimestamp', 
        'foreignField': 'blockchainTimestamp', 
        'as': 'totalpageview'
      }
    }, {
      '$unwind': {
        'path': '$totalpageview', 
        'preserveNullAndEmptyArrays': true
      }
    }, {
      '$project': {
        '_id': 1, 
        'blockchainTimestamp': 1, 
        'documentId': 1, 
        'pageview': 1, 
        'totalPageview': '$totalpageview.totalPageview', 
        'totalPageviewSquare': '$totalpageview.totalPageviewSquare'
      }
    }
  ])

  const pageviewMap = {}
  pageviewList.forEach((it)=>{
    pageviewMap[it.blockchainTimestamp] = it;
  })

  return pageviewMap;

}

/**
 * 
 * @param {*} param0 
 */
async function calcRewardMatrix({dailyMyVoteMatrix, dailyPageviewMap, dailyVoteMap}){

  return await Promise.all(dailyMyVoteMatrix.map((dailyMyVoteList)=>{
    //console.log("dailyMyVoteList", JSON.stringify(dailyMyVoteList));

    return calcRewardList({
      dailyMyVoteList,
      dailyPageviewMap,
      dailyVoteMap
    })
  }))

  
}

/**
 * 
 * @param {*} param0 
 */
async function calcRewardList({dailyMyVoteList, dailyPageviewMap, dailyVoteMap}){
  const votesWithRewardPromises = dailyMyVoteList.map(async (myVote)=>{
      
    const {voteAmount, voteDate, activeDate, rewardPoolInfo} = myVote;
    const activeTimestamp = utils.getBlockchainTimestamp(activeDate);

    const pageview = dailyPageviewMap[activeTimestamp] && dailyPageviewMap[activeTimestamp].pageview?dailyPageviewMap[activeTimestamp].pageview:0
    const totalPageviewSquare = dailyPageviewMap[activeTimestamp] && dailyPageviewMap[activeTimestamp].totalPageviewSquare?dailyPageviewMap[activeTimestamp].totalPageviewSquare:0
    //decimal -> string of number
    const totalVoteAmount = dailyVoteMap[activeTimestamp].toString();
    const myVoteAmount = voteAmount;
    const curatorDailyReward = rewardPoolInfo.curatorDailyReward
    const curatorReward = utils.calcReward({
      pageview: pageview,
      totalPageviewSquare: totalPageviewSquare,
      myVoteAmount: myVoteAmount,
      totalVoteAmount: totalVoteAmount,
      curatorDailyReward: curatorDailyReward,
    });

    
    return {
      voteDate,
      activeDate,
      voteAmount: voteAmount,
      value: curatorReward?curatorReward:MongoWrapper.Decimal128.fromString("0"),
      pageview: pageview,
      totalPageviewSquare: totalPageviewSquare,
      totalVoteAmount: totalVoteAmount,
      curatorDailyReward: curatorDailyReward
    }

  })
  const votesWithReward = await Promise.all(votesWithRewardPromises);

  return votesWithReward;
}
/*
function calcReward(args){
  
  const {pageview, totalPageviewSquare, myVoteAmount, totalVoteAmount, curatorDailyReward} = args;
  if(isNaN(pageview) || isNaN(totalPageviewSquare) || isNaN(myVoteAmount) || isNaN(totalVoteAmount) || isNaN(curatorDailyReward)){
    throw new Error(`args is invalid in calcReward  : ${JSON.stringify(args)}`)
  }

  let reward = ((Math.pow(pageview, 2) / totalPageviewSquare)) * ( myVoteAmount / totalVoteAmount ) * curatorDailyReward;

  reward  = Math.floor(reward * 100000) / 100000;
  //const strValue = web3.utils.toWei(reward + "", "ether");
  const strValue = reward?reward + "": "0";
  //console.log("calcReward", JSON.stringify(args), strValue);
  return MongoWrapper.Decimal128.fromString(strValue);
}
*/


/**
 * @name getLastClaimReward
 * @param {*} params 
 */
function getLastClaimReward({documentId, userId}){
  return new Promise(async (resolve, reject)=>{

    try{
      const claimList = await mongo.find(tables.CLAIM_REWARD, {
        query: {
          "_id.userId": userId,
          "_id.documentId": documentId
        }, 
        sort: {
          _id: -1
        },
        limit: 1
      })

      resolve(claimList[0]);
    } catch(err){
      reject(err);
    }
    
  });
}


async function saveCuratorRewards({documentId, userId, curatorRewards}){

  //save
  const savePromises = curatorRewards.map((curatorReward)=>{ 

    return saveCuratorReward({documentId, userId, curatorReward});
  })
 
  return await Promise.all(savePromises);
}

async function saveCuratorReward({documentId, userId, curatorReward}){
  //console.log("curatorReward", JSON.stringify(curatorReward));
  
  const saveClaimResult = await mongo.save(tables.CLAIM_REWARD, {
    _id: {
      documentId,
      userId,
      blockchainTimestamp: utils.getBlockchainTimestamp(curatorReward[0].voteDate)
    },
    curatorReward,
    voteDate: curatorReward[0].voteDate,
    voteAmount: curatorReward[0].voteAmount,
    totalReward: curatorReward.map((it)=>{return it.value}).reduce((sum, it)=>{  
      return new BigNumber(sum).plus(new BigNumber(it))
    }),
    created: Date.now()
  })
  
  
  let totalReward = new BigNumber(curatorReward[0].voteAmount);
  curatorReward.forEach((it)=>{
    totalReward = totalReward.plus(new BigNumber(it.value));
  })
  //console.log("total reward", totalReward.toString());
  const totalRewardByWei = web3.utils.toWei(totalReward.toString(), "ether");
  const saveWalletResult = await mongo.save(tables.WALLET, {
      userId: userId,
      type: "REWARD",
      factor: 1,
      value: MongoWrapper.Decimal128.fromString(totalRewardByWei),
      claimReward: saveClaimResult,
      created: Date.now()
    });

  return saveWalletResult;

}

async function getRewardPool(){

  const rewardPool = await mongo.find(tables.REWARD_POOL, {});

  return rewardPool.map((it)=>{
    return {
      start: it._id.start,
      end: it._id.end,
      creatorDailyReward: it.creatorDailyReward,
      curatorDailyReward: it.curatorDailyReward

    }
  })
}