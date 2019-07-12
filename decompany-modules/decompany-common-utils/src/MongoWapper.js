"use strict";

const mongojs = require('mongojs');

var MongoWapperSingletonInstance = null;
module.exports = class MongoWapper {

  constructor(connectionString) {
    if(MongoWapperSingletonInstance==null){
      this.connectionString = connectionString;
      this.init();
    }

    return MongoWapperSingletonInstance;
  }

  init() {

    if(MongoWapperSingletonInstance==null){
      this.db = mongojs(this.connectionString);
      MongoWapperSingletonInstance = this;
      //console.log("MongoWapper constructor runnging!!", this.connectionString);
    }

  }

  close() {
    //console.log("mongodb close()");
    this.db.close();
    MongoWapperSingletonInstance = null;
  }

  findOne(collection, query, projection) {

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

  find(collection, query, pageNo = 1, pageSize = 50, sort = {created : -1 /*decending*/ }) {
    this.init();

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
