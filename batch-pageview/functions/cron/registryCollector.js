'use strict';
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const ContractWapper = require('../ContractWapper');
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const {utils, MongoWapper} = require('decompany-common-utils');


const contractName = "DocumentRegistry"
const eventName = "Register";

module.exports.handler = async (event, context, callback) => {
 
  const wapper = new MongoWapper(mongodb.endpoint);
  
  try{
    const maxOne = await wapper.aggregate(eventName, [
      {
        $group: {
          _id: null,
          blockNumber : { $max: '$blockNumber' }
        }
      }
    ]);
     // contract write block number 3251154
    let startBlockNumber = 3251154;
    if(maxOne && maxOne.length>0){
      console.log(maxOne[0]);
      startBlockNumber = maxOne[0].blockNumber + 1;
    }
    
    console.log(`start blockNumber ${startBlockNumber} ~ latest`);

    const contractWapper = new ContractWapper();
    
    const resultList = await contractWapper.getEventLogs(contractName, eventName, startBlockNumber);
    console.log(`start blockNumber ${startBlockNumber} get event logs success!!!! ${resultList.length} count`);
    
    const bulk = wapper.getUnorderedBulkOp(eventName);

    resultList.forEach((result, index)=>{
      const {decoded, abi, created, log} = result;
      console.log(`Get Event Logs ${index} :`, result, );
      //console.log(index, abi.funcName, decoded, receipt.blockHash, receipt.blockNumber, new Date(block.timestamp * 1000));
      const documentId = contractWapper.hexToAscii(decoded.docId);
      //console.log(index, abi.name, decoded.docId, decoded.applicant, decoded.deposit, created, receipt.logs);
      
      console.log(" ");
      
      const item = {
        _id: log.id,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        documentId: documentId,
        docId: decoded.docId,
        pageView: Number(decoded.pageView),
        blockchainTimestamp: Number(decoded.timestamp),
        blockchainDate: new Date(Number(decoded.timestamp)),
        contractName: contractName,
        eventName: eventName,
        log: log
      }
      //console.log("new item", item);
      bulk.find({_id: item._id }).upsert().updateOne(item);
    })
    const executeResult = await wapper.execute(bulk);
    
    console.log("bulk complete", executeResult);
    
    return "success"
  } catch(e){
    console.error(e);
  } finally{
    wapper.close();
  }
  
};
