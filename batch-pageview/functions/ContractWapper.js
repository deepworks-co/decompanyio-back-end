'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const { ethereum } = require('../resources/config.js').APP_PROPERTIES();

module.exports = class ContractWapper {

  constructor() {
    const contract= JSON.parse(fs.readFileSync(jsonFile));  
    const providerUrl = ethereum.providerUrl;
    const account = ethereum.account;
    const privateKey = ethereum.privateKey;
    
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
    this.contractABI = contract.abi;

    this.myAddress = account;
    this.privateKey = Buffer.from(privateKey, 'hex');
    //contract abi is the array that you can get from the ethereum wallet or etherscan
    this.contractAddress = contract.networks[ethereum.index].address;
    //creating contract object
    this.DocumentReg = new this.web3.eth.Contract(this.contractABI, this.contractAddress, {
      from: this.myAddress
    });
        
    this.confirmPageViewContract = this.DocumentReg.methods.confirmPageView;
  }
 
  updateSignature(logging){
    return this.contractABI.map((item, index)=>{
      switch(item.type){
          case "event":
              item.signature = this.web3.eth.abi.encodeEventSignature(item);
              if(logging) console.log(`[${index}]`, item.type, item.name, item.signature)
              
              break;
          case "function":
              item.signature = this.web3.eth.abi.encodeEventSignature(item);
              if(logging) console.log(`[${index}]`, item.type, item.name, item.signature);
              
              break;
      }

      return item;
    })
  }

  getPrepareTransaction() {
    return new Promise((resolve, reject) => {
      const blocknumber = this.web3.eth.getBlockNumber();
      const promiseGasPrice = this.web3.eth.getGasPrice();

      Promise.all([blocknumber, promiseGasPrice]).then((values) => {
          const blockNumber = values[0];
          const gasPrice = values[1];
          this.web3.eth.getTransactionCount(this.myAddress, blockNumber).then((nonce)=>{
            resolve({
              blockNumber: blockNumber,
              gasPrice: gasPrice,
              nonce: nonce
            })
          }).catch((err) => {
            reject(err);
          });
      }).catch((err) => {
        reject(err);
      });
    });

  }
  /**
   * @param  {} docId
   * @param  {} date
   * @param  {} registYesterdayViewCount
   * @return {} Promise<number> The gas amount estimated.
   */
  getConfirmPageViewEstimateGas(docId, date, registYesterdayViewCount) {
    return this.DocumentReg.methods.confirmPageView(docId, date, registYesterdayViewCount).estimateGas({
      from: this.myAddress
    });
  }


  sendTransaction(gasPrice, gasLimit, nonce, contractABI) {
    
    return new Promise((resolve, reject) => {
      //creating raw tranaction
      const rawTransaction = {
          "from": this.myAddress,
          "gasPrice": this.web3.utils.toHex(gasPrice),
          "gasLimit": this.web3.utils.toHex(gasLimit),
          "to": this.contractAddress,
          "value":"0x0",
          "data": contractABI ,
          "nonce": this.web3.utils.toHex(nonce)
      }
      //console.log({message:"Raw Transcation", rawTransaction: rawTransaction});
      //creating tranaction via ethereumjs-tx
      const transaction = new Tx(rawTransaction);
      //signing transaction with private key
      transaction.sign(this.privateKey);
      //sending transacton via web3js module
      this.web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex')).then((transaction)=>{
        resolve(transaction);
      }).catch((err) => {
        reject(err);
      });
    });

  }



  asciiToHex(str){
    return this.web3.utils.asciiToHex(str);
  }

  hexToAscii(hex){
    return this.web3.utils.hexToAscii(hex);
  }


  isExistsDocument(documentId) {
    return this.DocumentReg.methods.contains(this.asciiToHex(documentId)).call({from: this.myAddress})
  }


  getAuthor3DayRewardOnDocument(accountId, documentId, blockchainTimestamp) {
    //contract getAuthor3DayRewardOnDocument
    const promise = this.DocumentReg.methods.getAuthor3DayRewardOnDocument(accountId, this.asciiToHex(documentId), blockchainTimestamp).call({
      from: this.myAddress
    });

    return promise;
  }

  /**
   * @description 문서에 대한 현재로 부터 3일간의  전체 Curator Reward의 총합
   * @param  {} documentId
   * @param  {} blockchainTimestamp
   */
  getCuratorDepositOnDocument (documentId, blockchainTimestamp) {
    //function getCuratorDepositOnDocument(bytes32 _docId, uint _dateMillis) public view returns (uint)
    return this.DocumentReg.methods.getCuratorDepositOnDocument(this.asciiToHex(documentId), blockchainTimestamp).call({from: this.myAddress});
  }
    
  calculateAuthorReward(authorAddress, viewCount, totalViewCount) {

    return this.DocumentReg.methods.calculateAuthorReward(viewCount, totalViewCount).call({
      from: authorAddress
    });

  }

  calculateCuratorReward(curatorId, documentId, viewCount, totalViewCount) {
    //function calculateCuratorReward(address _addr, bytes32 _docId, uint _pv, uint _tpvs) public view returns (uint)
    console.log(curatorId, documentId, viewCount, totalViewCount);
    return this.DocumentReg.methods.calculateCuratorReward(curatorId, this.asciiToHex(documentId), viewCount, totalViewCount).call({from: this.myAddress});
  }


  async getEventLogs(latestCollectedBlockNumber, eventName) {

    if(!eventName){
      throw new Error(`event is not invalid!! ${eventName}`);
    }
    
    const selectedAbi = this.contractABI.find((abi, index)=>{
      return abi.name === eventName;
    });

    if(!selectedAbi){
      throw new Error(`${eventName} is not exists in abi`)
    }
    const signature = selectedAbi.signature;//this.web3.eth.abi.encodeEventSignature(selectedAbi);

    //console.log(eventName, signature, selectedAbi);

    const pastLogs = await this.web3.eth.getPastLogs({
      fromBlock: latestCollectedBlockNumber,
      toBlock: "latest",
      address: this.contractAddress,
      topics: [ signature/*"0x0c75c6a0cc6b6403ea7acee71d8aa1556e09a34e8560c6f9ab5b6152bfcd8ef1"*/, null, null]
    });
    const promises = await pastLogs.map(async (log, index)=>{
      const block = await this.getBlock(log.blockNumber);
      //console.log("pastLogs", index, log);
      //return await this.getVoteTransactionReceipt(transaction, block)
      const decoded = await this.getDecodedLog(log, selectedAbi.inputs);

      return {
        abi: selectedAbi,
        decoded: decoded,
        created: block.timestamp * 1000,
        log: log
      }
    });
    const resultList = await Promise.all(promises);
    console.log(resultList);
    return resultList;
  }

  async getTransactionReceipt(transaction){

    return new Promise(async (resolve, reject)=>{
        
      this.web3.eth.getTransactionReceipt(transaction.transactionHash,  async (err, receipt) => {
        if(err) reject(err);
        else resolve(receipt);
      })
    });
  }

  async getVoteEvents(receipt, block){
    
    //console.log(`receipt ${JSON.stringify(receipt)}, blockNumber : ${receipt.blockNumber}, timestamp : ${new Date(blockTimestamp)}`)    
    const promises = await receipt.logs.filter((log)=> {

      return this.contractSignatureAbi.find((abi)=>{
        return abi.signature === log.topics[0]
      });

    }).map((log, idx)=>{
      console.log("map", idx, log);
      const selecedAbi = this.contractSignatureAbi.find((abi)=>{
        return abi.signature === log.topics[0]
      });

      const decoded = this.web3.eth.abi.decodeLog(selecedAbi.inputs, log.data, log.topics.splice(1));
      
      //console.log("decoded", new Date(blockTimestamp), selecedAbi.name, decoded);
      const event = {
        abi: selecedAbi,
        decoded: decoded,
        created: block.timestamp * 1000,
        receipt
      }
      return event;
    });
    const events = await Promise.all(promises);
    
    return events;
  }

  async getDecodedLog(log, inputs){
  
    const decoded = this.web3.eth.abi.decodeLog(inputs, log.data, log.topics.splice(1));
    
    return decoded;
  }

  async getBlock(blockNumber) {

    return new Promise((resolve, reject) =>{
        this.web3.eth.getBlock(blockNumber, function(err, block){
            if(err) reject(err);
            else resolve(block);
        })
    })
      
  }

  
}


