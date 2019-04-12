'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

const { region, ethereum } = require('../resources/config.js').APP_PROPERTIES();
const { s3, kms } = require('decompany-common-utils');

module.exports = class ContractWapper {

  constructor() {
    // websocket url example "wss://rinkeby.infura.io/ws/v3/43132d938aaa4d96a453fd1c708b7f6c"
    const providerUrl = ethereum.providerUrl;
    console.log(providerUrl);
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
    //this.web3 = new Web3(new Web3.providers.WebsocketProvider(providerUrl));
    this.myAddress = ethereum.account;
    const contract= JSON.parse(fs.readFileSync(ethereum.abi[0]));
    this.contractAddress = contract.networks[ethereum.index].address;
    this.contractABI = contract.abi;
    this.DocumentReg = new this.web3.eth.Contract(this.contractABI, this.contractAddress, {
      from: this.myAddress
    });
  }


  async init(){
    
    //contract abi is the array that you can get from the ethereum wallet or etherscan
    this.privateKey = await this.getPrivateKey(ethereum.privateKey);
    
    
  }

  async getPrivateKey(privateKey){
    
    if(typeof(privateKey)==="object"){
      const {bucket, key} = privateKey;
      const cipherText = await s3.getObject(bucket, key, region);
      const decrypt = await kms.decrypt(region, cipherText.Body);
      //const privateKeyBase64 = decrypt.Plaintext.toString("utf-8");
      return Buffer.from(decrypt.Plaintext, 'hex');
    } else if(typeof(privateKey) === "string"){
      return Buffer.from(privateKey, 'hex');
    } else {
      console.error("privateKey is not object or string", privateKey);
      throw new Error("privateKey is not object or string");
    }

    

    
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
   * @description write pageview on-chain for demo day
   * @param  {} documentId
   * @param  {} date
   * @param  {} confirmPageview
   */
  async sendTransactionConfirmPageView(documentId, date, confirmPageview) {
    const documentIdByte32 = this.asciiToHex(documentId);
    const values = await this.getPrepareTransaction();

    const recentlyBlockNumber = values.blockNumber;
    const nonce = values.nonce;
    const gasPrice = values.gasPrice;

    const estimateGas = await this.DocumentReg.methods.confirmPageView(documentIdByte32, date, confirmPageview).estimateGas({
      from: this.myAddress
    });

    const gasLimit = Math.round(estimateGas);

    return await this.sendTransaction(gasPrice, gasLimit, nonce, this.DocumentReg.methods.confirmPageView(documentIdByte32, date, confirmPageview).encodeABI());
  }

  /**
   * @description write pageview on-chain for alpha
   * @param  {} documentId
   * @param  {} date
   * @param  {} confirmPageview
   */
  async sendTransactionUpdatePageview(documentId, date, confirmPageview) {
    const documentIdByte32 = this.asciiToHex(documentId);
    const values = await this.getPrepareTransaction();

    const recentlyBlockNumber = values.blockNumber;
    const nonce = values.nonce;
    const gasPrice = values.gasPrice;

    const estimateGas = await this.DocumentReg.methods.confirmPageView(documentIdByte32, date, confirmPageview).estimateGas({
      from: this.myAddress
    });

    const gasLimit = Math.round(estimateGas);

    return await this.sendTransaction(gasPrice, gasLimit, nonce, this.DocumentReg.methods.confirmPageView(documentIdByte32, date, confirmPageview).encodeABI());
  }

  async sendTransaction(gasPrice, gasLimit, nonce, contractABI) {

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


  async isExistsDocument(documentId) {
    
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


  async getEventLogs(eventName, latestCollectedBlockNumber) {

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

    if(!signature){
      throw new Error(`signature is invaild!!! signature : ${signature}`);
    } 
    
    console.log({latestCollectedBlockNumber, eventName, signature, contract: this.contractAddress, selectedAbi});
    const options = {
      fromBlock: latestCollectedBlockNumber,
      toBlock: "latest",
      address: this.contractAddress,
      topics: [ signature ]
    }
    //console.log("getPastLogs options", options);
    const pastLogs = await this.web3.eth.getPastLogs(options);

    console.log("getPastLogs count", pastLogs.length);
    const promises = await pastLogs.map(async (log, index)=>{
      //console.log(`${index+1} getDecodedLog start`);
      const decoded = await this.getDecodedLog(log, selectedAbi.inputs);
      //const block = await this.getBlock(log.blockNumber);  
      
      return {
        abi: selectedAbi,
        decoded: decoded,
        //created: block.timestamp * 1000,
        log: log
      }
    });

    const resultList = await Promise.all(promises);
    //console.log(resultList);
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


