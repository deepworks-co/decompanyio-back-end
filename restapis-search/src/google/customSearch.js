'use strict';
const request = require('request');
const redisCache = require('../utils/redisCache');

const CSE_SEARCH_URL = process.env.CSE_SEARCH_URL;
const CSE_APIKEY = process.env.CSE_APIKEY;
const CSE_ENGINE_ID = process.env.CSE_ENGINE_ID;

module.exports.handler = async event => {

  console.log("event", event);

  const params = event.queryStringParameters;
  const {q, start, num, hq, searchType} = params;
  const query = {
    q,
    start,
    num,
    hq,
    searchType
  }
  const key = JSON.stringify(query);
  let result = await redisCache.get(key)

  if(result) {
    console.log("caching");
    result = JSON.parse(result);
  } else {
    result = await search(query);
    await redisCache.set(key, JSON.stringify(result));
  }

  result.queries.request = result.queries.request.map((req)=>{
    delete req.cx
    return req;
  })
  //console.log("result", JSON.stringify(result, 10, null))
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': "application/json",
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(result)
  }
};


function search(params){

  return new Promise((resolve, reject)=>{
    const options = {
      uri: CSE_SEARCH_URL,
      qs: Object.assign({
        key: CSE_APIKEY,
        cx: CSE_ENGINE_ID
      }, params)
    }
    request(options,function(err, response, body){
      //callback
      if(err){
        reject(err)
      } else {
        if(response.statusCode === 200){
          resolve(JSON.parse(body))
        } else {
          reject(new Error("Error: " + JSON.stringify(body)))
        }
        
      }

    })
  })
  
}