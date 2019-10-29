"use strict";

const mongojs = require('mongojs');

let MongoWapperSingletonInstance = null;
module.exports = class MongoWrapper {

  constructor(connectionString) {
    if(MongoWapperSingletonInstance==null){
      this.connectionString = connectionString;
      this.connect();
      
      //console.log("connect", MongoWapperSingletonInstance);
      
    } 

    return MongoWapperSingletonInstance;
  }

  connect() {
        
    if(MongoWapperSingletonInstance==null){
      
      this.db = mongojs(this.connectionString);
      MongoWapperSingletonInstance = this;

      this.db.on('error', function(err){
        console.error("mongo connection error", err);
        this.close();
      })

      this.db.on('connect', function(){
        this.id = Math.random().toString(36).substring(7);
        console.log("mongo connect", this.id);
      })
      

      this.db.on('close', function(){
        console.log("close", this.id);
        MongoWapperSingletonInstance = null;
      })


    } else {
      console.log("MongoWapperSingletonInstance is not null", MongoWapperSingletonInstance)
    }


  }

  status() {
    console.log("status this", this);
    console.log("status MongoWapperSingletonInstance", MongoWapperSingletonInstance);

    if(this.db){
      return {connected: true}
    } else {
      return {connected: false}
    }
    
  }

  reconnect() {
    if(!MongoWapperSingletonInstance || MongoWapperSingletonInstance === null){
      this.connect();
    }
  }

  close() {
    //console.log("close()", MongoWapperSingletonInstance);
    MongoWapperSingletonInstance = null;
    if(this.db){
      this.db.close();
    }
    
  }

  findOne(collection, query, projection) {
    //this.status();
    return new Promise((resolve, reject) => {
      this.db.collection(collection).findOne(query, projection, (err, doc)=>{
        if(err){
          reject(err);
        } else {
          resolve(doc);
        }       
      });

    });
  }

  query(collection, query) {
    return this.db.collection(collection).find(query);
  }


  find(collection, params) {
    const {query, sort, skip, limit} = params;
    return new Promise((resolve, reject) => {
      this.db.collection(collection).find(query?query:{}).sort(sort?sort:{_id: -1}).skip(skip?skip:0).limit(limit?limit:10).toArray((err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
      });

    });
  }
  /*
  find(collection, query, pageNo = 1, pageSize = 50, sort = {created : -1 }) {
    
    return new Promise((resolve, reject) => {

      const skip = !isNaN(pageNo) && pageNo > 1? ((pageNo - 1) * pageSize) : 0;

      this.db.collection(collection).find(query).skip(skip).limit(pageSize).sort(sort).toArray((err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
      });

    });
  }
  */


  findAll(collection, query, sort = {created : -1 /*decending*/ }, limit) {

    return new Promise((resolve, reject) => {

      if(Number(limit)>0){
        this.db.collection(collection).find(query).sort(sort).limit(limit).toArray((err, res)=>{
          if(err){
            reject(err);
          } else {
            resolve(res);
          }
        });
      } else {
        this.db.collection(collection).find(query).sort(sort).toArray((err, res)=>{
          if(err){
            reject(err);
          } else {
            resolve(res);
          }
        });
      }
    });
  }

  findWithProjection(collection, query, projection) {
    this.init();

    return new Promise((resolve, reject) => {

      this.db.collection(collection).find(query, projection, (err, res)=>{
        if(err) reject(err);
        else  resolve(res);
      });
    });
  }

  count (collection, query) {

    return new Promise((resolve, reject) => {

      this.db.collection(collection).count(query, (err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }

      });

    });
  }

  aggregate(collection, pipelines, options) {


    return new Promise((resolve, reject) => {

      this.db.collection(collection).aggregate(pipelines, options, (err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
 
      });

    });
  }

  insert(collection, item) {

    return new Promise((resolve, reject) => {

      this.db.collection(collection).insert(item, null, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }

      });

    });
  }

  save(collection, item) {

    return new Promise((resolve, reject) => {

      this.db.collection(collection).save(item, null, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }

      });

    });
  }

  save(collection, item, options) {


    return new Promise((resolve, reject) => {

      this.db.collection(collection).save(item, options, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        
        
      });

    });
  }


  update(collection, query, update, options) {

    return new Promise((resolve, reject) => {

      this.db.collection(collection).update(query, update, options?options:{}, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        
      });

    });
  }

  distinct(collection, field, query) {
    return new Promise((resolve, reject) => {

      this.db.collection(collection).distinct(field, query, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        
      });

    });
  }


  mapReduce(collection, map, reduce, opts) {
    return new Promise((resolve, reject) => {

      this.db.collection(collection).mapReduce(map, reduce, opts, (err, res)=>{
        if(err) reject(err);
        else  resolve(res);
      });
    });
  }

  getOrderedBulkOp(collection) {
    return this.db.collection(collection).initializeOrderedBulkOp();
  }

  getUnorderedBulkOp(collection) {
    return this.db.collection(collection).initializeUnorderedBulkOp();
  }

  execute(bulk) {

    return new Promise((resolve, reject) => {

      bulk.execute(function(err, res){
        if(err) reject(err);
        else resolve(res);
      });
    });

  }

};
