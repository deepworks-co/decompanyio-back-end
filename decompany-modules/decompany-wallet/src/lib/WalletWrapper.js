'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');

const { region, walletConfig } = require('decompany-app-properties');
const { s3, kms } = require('decompany-common-utils');


module.exports = class WalletWapper {

  constructor() {
    const providerUrl = walletConfig.providerUrl;
    this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

    this.contractMap = {};
    walletConfig.abis.forEach((abi)=>{
      const {name, path} = abi;
      const contractJson= require(path);
      const constractAbi = contractJson.abi;
      const constractAddress = contractJson.networks[walletConfig.psnet.id].address;
      const contract = new this.web3.eth.Contract(constractAbi, constractAddress);
      this.contractMap[name] = {
        abi: constractAbi,
        address: constractAddress,
        contract
      }
    });
    
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

  async sendGas(sender, receiver, ether) {
    console.log("sendGas", {sender, receiver, ether});

    const sendGasAmount = this.web3.utils.toWei(ether + "", "ether");

    const rawTransaction = await this.generationRawTransaction({senderAddress: sender.address, toAddress: receiver.address, ether: sendGasAmount});

    return this.sendTransaction(sender, rawTransaction);
  }

  /**
   * @description deck transfer
   * @param  {} sender
   * @param  {} recipient
   * @param  {} deck
   */
  async transferDeck(sender, recipient, deck) {
    console.log("transferDeck", {sender, recipient, deck});
    const contractName = "Deck";
    const Deck = this.contractMap[contractName].contract;
    const deckAmount = this.web3.utils.toWei(deck + "", "ether");
    const transferMethod = Deck.methods.transfer(recipient.address, deckAmount);
    const contractAddress = this.contractMap[contractName].address;

    const rawTransaction = await this.generationRawTransaction({senderAddress: sender.address, toAddress: contractAddress, method: transferMethod});

    return this.sendTransaction(sender, rawTransaction);
  }

  async generationRawTransaction(params) {

    const {senderAddress, toAddress, method, ether} = params
    let gasLimit = 0;
    if(method){
      const estimateGas = await method.estimateGas({
        from: senderAddress
      });
      gasLimit = Math.round(estimateGas);
    } else {
      const block = await this.web3.eth.getBlock("latest");
      console.log("latest block", block);
      gasLimit = block.gasLimit;
      
    }
    console.log("gasLimit", gasLimit);
    const gasPrice = await this.web3.eth.getGasPrice();

    const nonce = await this.web3.eth.getTransactionCount(senderAddress);
      //creating raw tranaction
    const rawTransaction = {
      "nonce": this.web3.utils.toHex(nonce),
      "gasPrice": this.web3.utils.toHex(gasPrice),
      "gasLimit": this.web3.utils.toHex(gasLimit),      
      "to": toAddress,
      "value": ether?this.web3.utils.toHex(ether):"0x0",      //ether!!
      "data": method?method.encodeABI():undefined
    }
    console.log("rawTransaction", {rawTransaction});

    return rawTransaction;
  }
  /**
   * @description transaction을 설정된 privatekey를 통하여 서명한뒤 infura로 보낸다.
   *              내부 node를 이용할경우 web3.eth.sendTransaction 이용 가능
   *              현재 상태에서는 transactionHash를 리턴하면 종료된다. (첫 응답)
   * @param  {} sender
   * @param  {} rawTransaction
   */
  sendTransaction(sender, rawTransaction) {
    console.log("sendTransaction", sender, rawTransaction);
    return new Promise((resolve, reject)=>{
      if(!sender.privateKey){
        reject(new Error("sender privateKey is undefined"));
      }

      if(!rawTransaction){
        reject(new Error("rawTransaction is undefined"));
      }
      
      //creating tranaction via ethereumjs-tx     
      const transaction = new Transaction(rawTransaction);
      //console.log(transaction);

      //signing transaction with private key
      transaction.sign(sender.privateKey);
      //sending transacton via web3js module
      this.web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
      .once('transactionHash', function(hash){
        console.log("transactionHash", hash);
        //resolve({success: true, transactionHash: hash});
      }).once('receipt', function(receipt){
        console.log("receipt", receipt);
        resolve(receipt);
      })
      /*.on('confirmation', function(confNumber, receipt){
        console.log("confirmation", {confNumber, receipt});
        //resolve({confNumber, receipt});
      }).on('error', function(error){
        console.log("sendTransaction error", error);
        reject({success: false, error: error});
      }).then(function(receipt){
        // will be fired once the receipt is mined
        console.log("complete", receipt);
        //resolve(receipt);
      });
      */
    });
    

  }



  asciiToHex(str){
    return this.web3.utils.asciiToHex(str);
  }

  hexToAscii(hex){
    return this.web3.utils.hexToAscii(hex);
  }

  getBalance(address) {

    return new Promise((resolve, reject) =>{
        this.web3.eth.getBalance(address)
        .then((balance)=>{
          resolve(balance);
        })
        .catch((err)=>{
          reject(err);
        })
    })  
      
  }

  getDeckBalance(address) {
    return new Promise((resolve, reject)=>{
      //const Deck = new this.web3.eth.Contract(this.contractMap["Deck"].abi, this.contractMap["Deck"].address);
      const Deck = this.contractMap["Deck"].contract;

      Deck.methods.balanceOf(address).call()
      .then((balance)=>{
        resolve(balance)
      })
      .catch((err)=>{
        reject(err);
      })
    })
    
    
  }

  getEventSignature(params) {
    const {abis} = params;

    return abis.filter((abi, index)=>{
      
      if(abi.type === 'event') {
        const k = {}
        k[abi.signature] = abi;
        return k;
      }
      
    });
  
  }

  getPastLog(params) {
    return new Promise((resolve, reject)=>{
      const options = {
        fromBlock: params.fromBlock,
        toBlock: "latest",
        address: params.address,
        topics: params.topics?params.topics:[]
      }
      
      console.log("getPastLog options", options);
      this.web3.eth.getPastLogs(options)
      .then((logs)=>{
        resolve(logs);
      })
      .catch((err)=>{
        reject(err);
      })
    })
    
  }

  getDecodedLog(parmas) {
    const {log, inputs} = params;
    
    const decoded = this.web3.eth.abi.decodeLog(inputs, log.data, log.topics.splice(1));
    
    return decoded;
  }

  
}


