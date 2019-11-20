'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, MongoWrapper, utils} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);
const PSNET_REGISTRY_ABI = require(`../../psnet/${stage}/Registry.json`)
const NETWORK_ID = walletConfig.psnet.id;

const REGISTRY_CONTRACT = buildContract(web3, PSNET_REGISTRY_ABI, NETWORK_ID);
const FOUNDATION_ID = walletConfig.foundation;
module.exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const today = new Date();
  const blockchainTimestamp = utils.getBlockchainTimestamp(today);
  console.log(today, blockchainTimestamp);
  const foundation = await getWalletAccount(FOUNDATION_ID);
  console.log("foundation", foundation);
  const setDateMillisMethod = REGISTRY_CONTRACT.methods.setDateMillis(blockchainTimestamp);


  const estimateGas = await setDateMillisMethod.estimateGas({
    from: foundation.address
  });
  const gasLimit = Math.round(estimateGas);
  const gasPrice = await web3.eth.getGasPrice();
  const nonce = await web3.eth.getTransactionCount(foundation.address);
  const pendingNonce = await web3.eth.getTransactionCount(foundation.address, "pending");

  console.log({gasLimit, gasPrice, nonce, pendingNonce});

  const rawTransaction = {
    "nonce": web3.utils.toHex(nonce),
    "gasPrice": web3.utils.toHex(gasPrice),
    "gasLimit": web3.utils.toHex(gasLimit),      
    "to": REGISTRY_CONTRACT.address,
    "value": "0x0",
    "data": setDateMillisMethod.encodeABI()
  }

  console.log("rawTransaction", rawTransaction);
  const privateKey = await decryptPrivateKey(foundation.base64EncryptedEOA); 
  const r = await sendTransaction(privateKey, rawTransaction);
  console.log("sendTransaction", r);
  callback(null, "complete");
};

function decryptPrivateKey(base64EncryptedEOA) {

  return new Promise((resolve, reject)=>{
    const encryptedData = Buffer.from(base64EncryptedEOA, 'base64');
    kms.decrypt(region, encryptedData)
    .then((data)=>{
      const {privateKey} = JSON.parse(data.Plaintext.toString("utf-8"));
      const privateKeyBuffer = new Buffer(privateKey.substring(2), 'hex')
      resolve(privateKeyBuffer);
    })
    .catch((err)=>{
      console.log(err);
      reject(err);
    })
    
  });
  
}



function getWalletAccount(userId){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {_id: userId})
    .then((data)=>{
      if(data) resolve(data);
      else reject(new Error(`${userId} is not exists`));
    })
    .catch((err)=>{
      reject(err);
    })
  })
}
function sendTransaction(privateKey, rawTransaction) {

  return new Promise((resolve, reject)=>{
    if(!privateKey){
      reject(new Error("sender privateKey is undefined"));
    }

    if(!rawTransaction){
      reject(new Error("rawTransaction is undefined"));
    }
    
    //creating tranaction via ethereumjs-tx     
    const transaction = new Transaction(rawTransaction);
    //console.log(transaction);

    //signing transaction with private key
    transaction.sign(privateKey);
    console.log("transaction", '0x'+transaction.serialize().toString('hex'));
    //sending transacton via web3js module
    web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
    .once('transactionHash', async function(hash){
      console.log("transactionHash", hash);
      //resolve({transactionHash: hash});      
    }).once('receipt', function(receipt){
      console.log("receipt", receipt);
      resolve(receipt);      
    })
  });
  

}
function buildContract(web3, json, networkId) {
  const address = json.networks[networkId].address;
  const contract = new web3.eth.Contract(json.abi, address);
  
  return {address, methods: contract.methods};
}