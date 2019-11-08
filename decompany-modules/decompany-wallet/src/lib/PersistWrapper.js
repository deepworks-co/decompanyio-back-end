'use strict';

const { mongodb, tables } = require('decompany-app-properties');
const { MongoWrapper, kms } = require('decompany-common-utils');

module.exports = class PersistWrapper {

  constructor() {

    this.mongo = new MongoWrapper(mongodb.endpoint);
    
  }

  getWalletAccount(userId){

    return new Promise((resolve, reject)=>{
      this.mongo.findOne(tables.WALLET_USER, {_id: userId})
      .then((data)=>{
        if(data) resolve(data);
        else reject(new Error(`${userId} is not exists`));
      })
      .catch((err)=>{
        reject(err);
      })
    })
  }


}


