'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');



const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const NETWORK_ID = walletConfig.psnet.id;
const CONTRACT_ADDRESS = PSNET_DECK_ABI.networks[NETWORK_ID].address;
const DECK_CONTRACT = new web3.eth.Contract(PSNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;

module.exports.handler = async (event, context, callback) => {
  
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return JSON.stringify({
      success: true,
      message: 'Lambda is warm!'
    });
  }


  const {principalId, body} = event;
  const {amount, toAddress} = body;

  try{

    if(!amount || !toAddress){
      throw new Error("[500] parameter is invalid!!");
    }
    const foundation = await getWalletAccount(FOUNDATION_ID)
    console.log("foundation address", foundation.address);
    const user = await getWalletAccount(principalId)

    const balance = await web3.eth.getBalance(user.address);
    console.log("user ether balance", user.address, balance);
    const deck = await DECK_CONTRACT.methods.balanceOf(user.address).call();
    console.log("user deck balance", user.address, deck);

    const privateKey = await decryptPrivateKey(user.base64EncryptedEOA);

    const value = web3.utils.toWei(amount + "", "ether");
    console.log("withdraw amount : ", amount, value)
    const r = await withdraw({
      from: user.address,
      to: foundation.address,
      value: value,
      privateKey, privateKey
    })

    if(!r.transactionHash){
      throw new Error("Error Withdraw Transaction")
    }

    console.log("withdraw result", r, `${value}(${amount})` );
    const saveData = {
      _id: r.transactionHash,
      status: "PENDING",
      toAddress: toAddress,
      created: Date.now()
    }

    await saveWithdrawToMongoDB(saveData);

    return JSON.stringify({
      success: true,
      result: r
    })

  } catch (err){
    console.error(err);
    return new Error(`[500] ${err.toString()}`);
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
      
      const {address, privateKey} = JSON.parse(data.Plaintext.toString("utf-8"));
      console.log("decryptPrivateKey", data.Plaintext.toString("utf-8"));
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
  console.log("withdraw parameter", params);

  return new Promise(async (resolve, reject)=>{
    try{
      const transferMethod = DECK_CONTRACT.methods.transfer(to, value);
  
      const estimateGas = await transferMethod.estimateGas({
        from: from
      });
      const gasLimit = Math.round(estimateGas);
      
      const gasPrice = await web3.eth.getGasPrice();
      
      const nonce = await web3.eth.getTransactionCount(from);

      const pendingNonce = await web3.eth.getTransactionCount(from, "pending");

      if(pendingNonce > nonce){
        throw new Error('pending transaction error');
      }

      console.log({gasLimit, gasPrice, nonce});

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

function saveWithdrawToMongoDB(params){
  return new Promise((resolve, reject)=>{
    mongo.insert(tables.WALLET_WITHDRAW, params)
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}