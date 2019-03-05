const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

module.exports = class ContractWapper {
  
  constructor(abi, networkUrl, network, account, priveteKey) {

    this.web3 = new Web3(new Web3.providers.HttpProvider(networkUrl));
    this.contractABI = abi;
    this.myAddress = account;//priv.address;
    this.privateKey = Buffer.from(priveteKey, 'hex');
    //contract abi is the array that you can get from the ethereum wallet or etherscan
    this.contractAddress = network.address;//"0xf84cffd9aab0c98ea4df989193a0419dfa00b07e";
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

  getAuthor3DayRewardOnDocument(accountId, documentId, blockchainTimestamp) {
    //contract getAuthor3DayRewardOnDocument
    //return DocumentReg.methods.getCuratorDepositOnDocument(this.asciiToHex(documentId), blockchainTimestamp).call({from: myAddress});
    const promise = this.DocumentReg.methods.getAuthor3DayRewardOnDocument(accountId, asciiToHex(documentId), blockchainTimestamp).call({
      from: this.myAddress
    });

    return promise;
  }

  asciiToHex(str){
    return this.web3.utils.asciiToHex(str);
  }


  isExistsDocument(documentId) {
    return this.DocumentReg.methods.contains(asciiToHex(documentId)).call({from: this.myAddress})
  }

  getCuratorDepositOnDocument (documentId, blockchainTimestamp) {
    //function getCuratorDepositOnDocument(bytes32 _docId, uint _dateMillis) public view returns (uint)
    console.log(documentId, blockchainTimestamp);
    return this.DocumentReg.methods.getCuratorDepositOnDocument(asciiToHex(documentId), blockchainTimestamp).call({from: this.myAddress});
  }

  calculateCuratorReward(curatorId, documentId, viewCount, totalViewCount) {
    //function calculateCuratorReward(address _addr, bytes32 _docId, uint _pv, uint _tpvs) public view returns (uint)
    console.log(curatorId, documentId, viewCount, totalViewCount);
    return this.DocumentReg.methods.calculateCuratorReward(curatorId, asciiToHex(documentId), viewCount, totalViewCount).call({from: this.myAddress});
  }
}


