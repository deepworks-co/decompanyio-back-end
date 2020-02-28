"use strict";
const _ = require('lodash')
const R = require('rambda')

const Redis = require('ioredis');



module.exports = class CacheWrapper {

  constructor(endpoint, port, db) {
    this.self = this;
    this.endpoint = endpoint;
    this.port = port;
    this.db = db;

    this.redis = new Redis({
      port: port,   // Redis port
      host: endpoint,   // Redis host
      db: db?db:0
    });

  }

  
  get(key){
    return new Promise((resolve, reject)=>{
      this.redis.get(key, (err, res)=>{
          if(err){
              reject(err);
          } else {
              resolve(res);
          }
      })
    })
  }

  set(key, data, expireAtSec){
    return new Promise((resolve, reject)=>{
      if(!key || !data){
        reject(new Error("args is invaild.."))
      }
      
      const callback = (err, res)=>{
        if(err){
          reject(err)
        } else {
            resolve(res)
        }
      }
      
      if(!isNaN(expireAtSec) && expireAtSec > 0){
        this.redis.set(key, data, "EX", expireAtSec, callback)
        console.log("expired at caching : " + key, expireAtSec)
      } else {
        this.redis.set(key, data, callback)
      }
      
    })
  }

  del(key){
    const callback = (err, res)=>{
      if(err){
        reject(err)
      } else {
        resolve(res)
      }
    }

    return new Promise((resolve, reject)=>{
      this.redis.del(key, callback);
    })
  }


}
