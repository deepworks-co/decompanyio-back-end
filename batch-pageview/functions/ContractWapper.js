'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

const { region, ethereum } = require('../resources/config.js').APP_PROPERTIES();
const { s3, kms } = require('decompany-common-utils');
const contractName = ["DocumentRegistry", "Creator", "Curator"];

module.exports = class ContractWapper {

  constructor() {
    // websocket url example "wss://rinkeby.infura.io/ws/v3/43132d938aaa4d96a453fd1c708b7f6c"
    const providerUrl = ethereum.providerUrl;
    console.log(providerUrl);
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
    //this.web3 = new Web3(new Web3.providers.WebsocketProvider(providerUrl));
    this.myAddress = ethereum.account;

    this.contractMap = {};
    ethereum.abis.forEach((abi)=>{
      const {name, path} = abi;
      const contractJson= JSON.parse(fs.readFileSync(path));
      const constractAbi = contractJson.abi;
      const constractAddress = contractJson.networks[ethereum.index].address;
      const contract = this.web3.eth.Contract(constractAbi, constractAddress, {
        from: this.myAddress
      });

      this.contractMap[name] = {
        abi: constractAbi,
        address: constractAddress,
        contract: contract
      }

      console.log("init contract", abi);
    });

    
    this.DocumentReg = this.contractMap["DocumentRegistry"].contract;
    this.Creator = this.contractMap["Creator"].contract;
    this.Curator = this.contractMap["Curator"].contract;
    
  }

  async getPrivateKey(privateKey){
    
    if(typeof(privateKey)==="object"){
      const {bucket, key} = privateKey;
      const cipherText = await s3.getObject(bucket, key, region);

      const decrypt = await kms.decrypt(region, cipherText.Body);
      const decryptPlainText = decrypt.Plaintext.toString("utf-8")
      /*
      if(process.env.stage==="local"){
        console.log("cipherText in s3", cipherText.Body.toString("utf-8"));
        console.log("decrypt Plaintext", decryptPlainText);
      }
      */
      return Buffer.from(decryptPlainText, 'hex');
    } else if(typeof(privateKey) === "string"){
      return Buffer.from(privateKey, 'hex');
    } else {
      console.error("privateKey is not object or string", privateKey);
      throw new Error("privateKey is not object or string");
    }

  }

  /**
   * @description write pageview on-chain for demo day
   * @param  {} documentId
   * @param  {} date
   * @param  {} confirmPageview
   */
  async sendTransactionConfirmPageView(date, documentIds, pageviews) {
  
    const writePageViewMethod = this.DocumentReg.methods.updatePageViews;//this.contractMap["DocumentRegistry"].contract.methods.updatePageViews;
    const contractAddress = this.contractMap["DocumentRegistry"].address;
    /*
    console.log("contract address", this.contractMap["DocumentRegistry"].address);
    console.log("contract abi", this.contractMap["DocumentRegistry"].abi);
    console.log("writePageViewMethod", writePageViewMethod);
    */
    console.log("foundation address", this.myAddress);
    console.log("start estimate gas", date, documentIds, pageviews);
    const estimateGas = await writePageViewMethod(date, documentIds, pageviews).estimateGas({
      from: this.myAddress
    });
    const gasLimit = Math.round(estimateGas);

    const gasPrice = await this.web3.eth.getGasPrice();

    const nonce = await this.web3.eth.getTransactionCount(this.myAddress);

    console.log("sendTransactionConfirmPageView", {gasLimit, gasPrice, nonce});

    this.privateKey = await this.getPrivateKey(ethereum.privateKey);
    
    return await this.sendTransaction(gasPrice, gasLimit, nonce, writePageViewMethod(date, documentIds, pageviews).encodeABI(), contractAddress);
  }

  /**
   * @description transaction을 설정된 privatekey를 통하여 서명한뒤 infura로 보낸다.
   *              내부 node를 이용할경우 web3.eth.sendTransaction 이용 가능
   *              현재 상태에서는 transactionHash를 리턴하면 종료된다. (첫 응답)
   * @param  {} documentId
   * @param  {} date
   * @param  {} confirmPageview
   */
  sendTransaction(gasPrice, gasLimit, nonce, encodeABI, contractAddress) {
    return new Promise((resolve, reject)=>{
        //creating raw tranaction
      const rawTransaction = {
        "from": this.myAddress,
        "gasPrice": this.web3.utils.toHex(gasPrice),
        "gasLimit": this.web3.utils.toHex(gasLimit),
        "to": contractAddress,
        "value":"0x0",      //ether!!
        "data": encodeABI ,
        "nonce": this.web3.utils.toHex(nonce)
      }
      console.log("sendTransactionConfirmPageView", {rawTransaction});
      //creating tranaction via ethereumjs-tx
      const transaction = new Tx(rawTransaction);
      //signing transaction with private key
      transaction.sign(this.privateKey);
      //sending transacton via web3js module
      this.web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex')).once('transactionHash', function(hash){
        console.log("transactionHash", hash);
        resolve({success: true, transactionHash: hash});
      }).once('receipt', function(receipt){
        console.log("receipt", receipt);
        resolve(receipt);
      }).on('confirmation', function(confNumber, receipt){
        console.log("confirmation", {confNumber, receipt});
        resolve({confNumber, receipt});
      }).on('error', function(error){
        console.log("sendTransaction error", error);
        reject({success: false, error: error});
      }).then(function(receipt){
        // will be fired once the receipt is mined
        console.log("receipt", receipt);
        resolve(receipt);
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


  async getEventLogs(contractName, eventName, latestCollectedBlockNumber) {

    if(!eventName){
      throw new Error(`event is not invalid!! ${eventName}`);
    }
    
    const contractABI = this.contractMap[contractName].abi;

    const selectedAbi = contractABI.find((abi, index)=>{
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


