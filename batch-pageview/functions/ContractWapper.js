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
    const networkIndex = ethereum.index;

    this.web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
    this.contractABI = contract.abi;
    this.myAddress = account;
    this.privateKey = Buffer.from(privateKey, 'hex');
    //contract abi is the array that you can get from the ethereum wallet or etherscan
    this.contractAddress = contract.networks[networkIndex].address;
    //creating contract object
    this.DocumentReg = new this.web3.eth.Contract(this.contractABI, this.contractAddress, {
      from: this.myAddress
    });
    this.confirmPageViewContract = this.DocumentReg.methods.confirmPageView;
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
}


