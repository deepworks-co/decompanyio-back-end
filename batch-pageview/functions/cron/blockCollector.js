'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');
const maxSize = 500;
module.exports.handler = async (event, context, callback) => {
 
  const wapper = new MongoWapper(mongodb.endpoint);
  const tableName = tables.EVENT_BLOCK;
  try{
    const maxOne = await wapper.findAll(tableName, {}, {_id: -1}, 1);
     // contract write block number 3251154
    let startBlockNumber = 3936298;
    if(maxOne && maxOne.length>0){
      console.log(maxOne[0]);
      startBlockNumber = maxOne[0]._id + 1;
    }

    let latestBlockNumber = startBlockNumber + maxSize;
    
    console.log(`start blockNumber ${startBlockNumber} ~ ${latestBlockNumber}`);
    const bulk = wapper.getUnorderedBulkOp(tableName);
    const contractWapper = new ContractWapper();
    for(let blockNumber = startBlockNumber ; blockNumber < latestBlockNumber ; blockNumber++){
      const block = await contractWapper.getBlock(blockNumber);
      if(!block){
        console.log(`Current Last Block Number ${blockNumber}`);
        break;
      }
      block.created = block.timestamp * 1000;
      block.createdDate = new Date(block.timestamp * 1000);
      block._id = block.number;     
      //console.log(block._id);
      bulk.find({_id: block._id}).upsert().updateOne(block);
    }
    
    const executeResult = await wapper.execute(bulk);
    
    console.log("bulk complete", executeResult);
    
    return "success"
  } catch(e){
    console.error(e);
  } finally{
    wapper.close();
  }
  
};
