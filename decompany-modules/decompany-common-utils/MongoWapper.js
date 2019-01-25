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

  findOne(collection, query) {

    this.init();

    return new Promise((resolve, reject) => {
      this.db.collection(collection).findOne(query, (err, doc)=>{

        if(err){
          reject(err);
        } else {
          resolve(doc);
        }
        this.close();
      });

    });
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
        this.close();
      });

    });
  }

  findAll(collection, query, sort = {created : -1 /*decending*/ }) {
    this.init();

    return new Promise((resolve, reject) => {

      const skip = !isNaN(pageNo) && pageNo > 1? ((pageNo - 1) * pageSize) : 0;

      this.db.collection(collection).find(query).sort(sort).toArray((err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        this.close();
      });

    });
  }

  count (collection, query) {
    this.init();

    return new Promise((resolve, reject) => {


      this.db.collection(collection).count(query, (err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        this.close();
      });

    });
  }

  aggregate(collection, pipelines, options) {
    this.init();

    return new Promise((resolve, reject) => {

      this.db.collection(collection).aggregate(pipelines, options, (err, res)=>{
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        this.close();
      });

    });
  }

  insert(collection, item) {
    this.init();

    return new Promise((resolve, reject) => {

      this.db.collection(collection).insert(item, null, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        this.close();
      });

    });
  }

  save(collection, item) {
    this.init();

    return new Promise((resolve, reject) => {

      this.db.collection(collection).save(item, null, (err, res)=>{
        
        if(err){
          reject(err);
        } else {
          resolve(res);
        }
        this.close();
      });

    });
  }

};
