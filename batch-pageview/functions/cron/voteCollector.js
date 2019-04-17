'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');
const contractName = "Curator";
const eventName = "AddVote";
module.exports.handler = async (event, context, callback) => {
 

  const wapper = new MongoWapper(mongodb.endpoint);
  const tableName = tables.VOTE;
  try{
    const maxOne = await wapper.aggregate(tableName, [
      {
        $group: {
          _id: null,
          blockNumber : { $max: '$blockNumber' }
        }
      }
    ]);
    // contract write block number 3251154
    let startBlockNumber = 1;
    if(maxOne && maxOne.length>0){
      console.log(maxOne[0]);
      startBlockNumber = maxOne[0].blockNumber + 1;
    }
    startBlockNumber = 1;
    const contractWapper = new ContractWapper();
    const resultList = await contractWapper.getEventLogs(contractName, eventName, startBlockNumber);
    console.log(`start blockNumber ${startBlockNumber} get event logs success!!!! ${resultList.length} count`);
    
    const bulk = wapper.getUnorderedBulkOp(tableName);

    const promises = resultList.map(async (result, index)=>{
      const {decoded, abi, log} = result;
      //console.log(result);
      //console.log(index, abi.funcName, decoded, receipt.blockHash, receipt.blockNumber, new Date(block.timestamp * 1000));
      const documentId = contractWapper.hexToAscii(decoded.docId);
      //console.log(index, abi.name, decoded.docId, decoded.applicant, decoded.deposit, created, receipt.logs);
      const block = await contractWapper.getBlock(log.blockNumber);
      //console.log("get block", block);
      
      const item = {
        _id: log.id,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        documentId: documentId,
        docId: decoded.docId,
        applicant: decoded.applicant,
        deposit: Number(decoded.deposit),
        created: block.timestamp * 1000,
        contractName: contractName,
        eventName: eventName,
        log: log
      }
      //console.log("new item", item);
      bulk.find({_id: item._id }).upsert().updateOne(item);
      return item;
    })

    const result = await Promise.all(promises);
    console.log("resultList process", result);

    const executeResult = await wapper.execute(bulk);
    
    console.log("bulk complete", executeResult);
    
    return callback(null, executeResult);
  } catch(e){
    console.error(e);
  } finally{
    wapper.close();
  }
  
};
