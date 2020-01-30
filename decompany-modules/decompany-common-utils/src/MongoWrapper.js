"use strict";

const mongojs = require('mongojs');

module.exports = class MongoWrapper {

  constructor(connectionString) {
    const self = this;
    this.connectionString = connectionString;
    this.db = mongojs(this.connectionString);


    this.db.on('error', function(err){
      console.error("mongo connection error", err);
      self.close();
    })

    this.db.on('connect', function(){
      self.id = Math.random().toString(36).substring(7);
      self.timestamp = Date.now();
      console.log("mongo connect", self.id);
    })
    

    this.db.on('close', function(){
      console.log("close", self);
    })

  }

  status() {

    return {
      instance: this, 
      connString: this.db._connString
    }
    
  }

  getConnection(){
    return new Promise((resolve, reject) =>{
      this.db._getConnection(function(err, data){
        if(err) reject(err)
        else resolve(data)
      });
    });
  }

  collections(){
    return new Promise((resolve, reject) =>{
      this.db.getCollectionNames(function(err, data){
        if(err) reject(err)
        else resolve(data)
      });
    });
  }

  database(){
    return this.db.toString();
  }

  stats() {
    return new Promise((resolve, reject)=>{
      this.db.stats()
    })
  }

  close() {   
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

  removeOne(collection, query) {
    return new Promise((resolve, reject) => {

      this.db.collection(collection).remove(query, { justOne: true }, (err, res)=>{
        
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


module.exports.Binary = mongojs.Binary
module.exports.Code = mongojs.Code
module.exports.DBRef = mongojs.DBRef
module.exports.Double = mongojs.Double
module.exports.Int32 = mongojs.Int32
module.exports.Long = mongojs.Long
module.exports.MaxKey = mongojs.MaxKey
module.exports.MinKey = mongojs.MinKey
module.exports.NumberLong = mongojs.Long // Alias for shell compatibility
module.exports.ObjectId = mongojs.ObjectId
module.exports.ObjectID = mongojs.ObjectID
module.exports.Symbol = mongojs.Symbol
module.exports.Timestamp = mongojs.Timestamp
module.exports.Map = mongojs.Map
module.exports.Decimal128 = mongojs.Decimal128
module.exports.NumberDecimal = mongojs.NumberDecimal