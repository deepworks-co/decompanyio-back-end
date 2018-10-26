const fs = require('fs');
const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/43132d938aaa4d96a453fd1c708b7f6c"));
const jsonFile = "contracts-rinkeby/DocumentReg.json";
const parsed= JSON.parse(fs.readFileSync(jsonFile));
const abis = parsed.abi;

const myAddress = "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15";//priv.address;
const privateKey = Buffer.from("E8760C95C5B615D791DFC1FAB3C4B736217845D5E818CA2472BD2D8E34C8CAB6", 'hex');
//contract abi is the array that you can get from the ethereum wallet or etherscan
const contractABI = abis;
const contractAddress ="0x78817aae0586d1d4ba61475deeecee63d3236b00";
//creating contract object
const DocumentReg = new web3.eth.Contract(abis, contractAddress, {
  from: myAddress
});

exports.confirmPageViewContract = DocumentReg.methods.confirmPageView;

exports.getPrepareTransaction = () => {

  return new Promise((resolve, reject) => {

    const blocknumber = web3.eth.getBlockNumber();
    const promiseGasPrice = web3.eth.getGasPrice();

    Promise.all([blocknumber, promiseGasPrice]).then((values) => {
        const blockNumber = values[0];
        const gasPrice = values[1];
        web3.eth.getTransactionCount(myAddress, blockNumber).then((nonce)=>{
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

};

exports.getConfirmPageViewEstimateGas = (docId, date, registYesterdayViewCount) => {
  return DocumentReg.methods.confirmPageView(docId, date, registYesterdayViewCount).estimateGas({
    from: myAddress
  });
};


exports.sendTransaction = (gasPrice, gasAmount, nonce, contractABI) => {
  return new Promise((resolve, reject) => {
    //creating raw tranaction
    const rawTransaction = {
        "from":myAddress,
        "gasPrice":web3.utils.toHex(gasPrice),
        "gasLimit":web3.utils.toHex(gasAmount),
        "to":contractAddress,
        "value":"0x0",
        "data":contractABI ,
        "nonce": web3.utils.toHex(nonce)
    }
    //console.log({message:"Raw Transcation", rawTransaction: rawTransaction});
    //creating tranaction via ethereumjs-tx
    var transaction = new Tx(rawTransaction);
    //signing transaction with private key
    transaction.sign(privateKey);
    //sending transacton via web3js module
    web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex')).then((transaction)=>{
      resolve(transaction);
    }).catch((err) => {
      reject(err);
    });
  })
};

exports.asciiToHex = function (str) {
  return web3.utils.asciiToHex(str);
};


module.exports.isExistsDocument = (documentId) => {
  return DocumentReg.methods.contains().call(asciiToHex(documentId), {from: myAddress})
};
