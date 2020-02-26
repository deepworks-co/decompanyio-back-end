'use strict';
const cache = require('./cache')
const Redis = require('ioredis');
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

const redis = new Redis({
  port: REDIS_PORT,   // Redis port
  host: REDIS_HOST,   // Redis host
  db: 0
});

module.exports.hello = async event => {

  const key = "test"

  const result = await cache.get(key)

  if(result) console.log("redis result", result);
  
  return {
    statusCode: 200,
    headers: {
      contentType: "application/json"
    },
    body: JSON.stringify({
        message: result?JSON.parse(result):'redis cache is null',
      },
      null,
      2
    )
  }
};
