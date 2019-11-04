'use strict';
const R = require('ramda');
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const CONTRACT_ADDRESS = PSNET_DECK_ABI.networks[walletConfig.psnet.id].address;
const DECK_CONTRACT = new web3.eth.Contract(PSNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;

module.exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }


  const {principalId, body} = event;

  try{
    const foundation = await getWalletAccount(FOUNDATION_ID)

    const user = await getWalletAccount(principalId)

    const privateKey = await decryptPrivateKey(user.base64EncryptedEOA);


  } catch (err){

  }

};


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

function decryptPrivateKey(base64EncryptedPrivateKey) {
  
  return new Promise((resolve, reject)=>{
    const encryptedData = Buffer.from(base64EncryptedPrivateKey, 'base64');
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

function withdraw(params){

  const {from, to, value, privateKey} = params;

  return new Promise(async (resolve, reject)=>{
    try{
      const transferMethod = DECK_CONTRACT.methods.transfer(to, value);
  
      const estimateGas = await transferMethod.estimateGas({
        from: from
      });
      const gasLimit = Math.round(estimateGas);
      
      console.log("gasLimit", gasLimit);
      const gasPrice = await web3.eth.getGasPrice();

      const nonce = await web3.eth.getTransactionCount(from);
        //creating raw tranaction
      const rawTransaction = {
        "nonce": web3.utils.toHex(nonce),
        "gasPrice": web3.utils.toHex(gasPrice),
        "gasLimit": web3.utils.toHex(gasLimit),      
        "to": CONTRACT_ADDRESS,
        "value": "0x0",
        "data": transferMethod.encodeABI()
      }

      console.log("rawTransaction", rawTransaction);

      const r = await sendTransaction(privateKey, rawTransaction);
      resolve(r);
    } catch (err) {
      reject(err);
    }
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
    //sending transacton via web3js module
    web3.eth.sendSignedTransaction('0x'+transaction.serialize().toString('hex'))
    .once('transactionHash', async function(hash){
      console.log("transactionHash", hash);
      resolve({transactionHash: hash});      
    }).once('receipt', function(receipt){
      console.log("receipt", receipt);
      
    })
  });
  

}