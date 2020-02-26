const Redis = require('ioredis');
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const EXPIRE_TIME = 60 * 5
const redis = new Redis({
  port: REDIS_PORT,   // Redis port
  host: REDIS_HOST,   // Redis host
  db: 0
});


module.exports = {
    get,
    set
}

function get(key){
    return new Promise((resolve, reject)=>{
        redis.get(key, (err, res)=>{
            if(err){
                reject(err);
            } else {
                resolve(res);
            }
        })
    })
}

function set(key, data){
    return new Promise((resolve, reject)=>{
        redis.set(key, data, "EX", EXPIRE_TIME, (err, res)=>{
            if(err){
                reject(err);
            } else {
                resolve(res);
            }
        })
    })
}