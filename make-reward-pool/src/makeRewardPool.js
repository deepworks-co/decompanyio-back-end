'use strict';
const {utils, MongoWrapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig } = require('decompany-app-properties');

const TOTAL_TOKEN = 10000000000; //총 100억 Deck 발행
const TOTAL_REWARD_RATE = 0.12; // 총 발행량의 12%를 Reward로 지정
const TOTAL_REWARD = TOTAL_TOKEN * TOTAL_REWARD_RATE;
const N = 10; //10년치
const BASE_DATE = new Date(Date.UTC(2019, 10, 12));//최초 Reward 시작일 UTC 2019. 11. 12
console.log("BASE DATE", BASE_DATE);
module.exports.handler = async (event, context, callback) => {

  let accumulatedToken = 0;
  console.log("TOTAL REWARD", TOTAL_REWARD)

  const warpper = new MongoWrapper(mongodb.endpoint);
  
  Array.from(Array(N)).map((n, i)=>{
    const year = i+1;
    const rate = 12 * Math.pow((1/2), year);
    const reward = TOTAL_TOKEN * (rate/100);
    accumulatedToken+=reward
    //console.log(`${year} ${rate} ${reward}  ${accumulatedToken}`);
    const date = getDate(BASE_DATE, year-1);
    return {
      _id: {start: date.start, end: date.end},
      subtract: date.subtract,
      count: year,
      rate: rate,
      reward: reward, 
      accumulatedToken:  accumulatedToken
    };
  }).map((it)=>{
    const creatorReward = it.reward * 0.7
    const curatorReward = it.reward * 0.3;
    //console.log(it.date, "creatorReward", creatorReward, "curatorReward", curatorReward, `${it.reward}(${creatorReward+ curatorReward})`);
    it.creatorReward = creatorReward;
    it.curatorReward = curatorReward;
    it.creatorRewaryDaily = creatorReward/it.subtract;
    it.curatorRewaryDaily = curatorReward/it.subtract;
    return it
  }).forEach((it)=>{
    console.log(JSON.stringify(it));
    warpper.insert(tables.REWARD_POOL, it);
  })

  return JSON.stringify({
    success: true
  })
};


function getDate(baseDate, n){

  const year = baseDate.getUTCFullYear()+(n?n:0);
  const month = baseDate.getUTCMonth();
  const dayOfMonth = baseDate.getUTCDate();

  //console.log(baseDate, year, month, dayOfMonth);

  const start = new Date(Date.UTC(year, month, dayOfMonth));
  const end = new Date(Date.UTC(year+1, month, dayOfMonth));

  return {
    start: start,
    end: end,
    subtract: (end-start) / (1000*60*60*24)
  }
}