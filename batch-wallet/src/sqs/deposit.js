'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sqs, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const CONTRACT_ADDRESS = PSNET_DECK_ABI.networks[walletConfig.psnet.id].address;
const DECK_CONTRACT = new web3.eth.Contract(PSNET_DECK_ABI.abi, CONTRACT_ADDRESS);
const FOUNDATION_ID = walletConfig.foundation;

  /*
  * 입금의 경우 메인넷의 Deck이 user->foundation으로 이동했기때문에,
  * psnet에서는 같은 양의 Deck을 foundation->user로 이동시킨다.
  */
module.exports.handler = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try{
    console.log("sqs event", event.Records);
    const record = event.Records[0];

    const params = await validate(record)
    console.log("vaildate parameter", params);

    const {logId, from, to, value, privateKey} = params;
    const check = await checkDepositResult(tables.WALLET_DEPOSIT, {_id: logId});

    if(check){
      return callback(null, `deposit result saved ${logId}`);
    }

    const result = await transferDeck(from, to, value, privateKey);

    const updateResult = await updateDepositResult(tables.WALLET_DEPOSIT, {_id: logId}, {result: result});
    console.log("updateDepositResult", updateResult);

    
  } catch(err){
    console.error(err);
  } finally {
    return callback(null, "complete")
  }
  
};

async function validate(record){
  const {body} = record;
  const parsedBody =  JSON.parse(body);
  const {returnValues, id} = parsedBody;
  const {from, to, value} = returnValues;

  const foundation = await getWalletAccount(FOUNDATION_ID);
  const privateKey = await decryptPrivateKey(foundation);
  if(foundation.address !== to){
    throw new Error("this address is not foundation!! : " + to);
  }

  const user = await getUser(from);
  const targetUser = await getWalletAccount(user._id);
  console.log("mainnet address", from, "psnet address", targetUser.address);
  
  return {
    logId: id,
    from: foundation.address,
    to: targetUser.address,
    value: value,
    foundation,
    privateKey
  }
}

function getUser(ethAccount){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.USER, {ethAccount: ethAccount})
    .then((data)=>{
      if(data) resolve(data);
      else reject(new Error(`${ethAccount} is not exists in USER Collection`));
    })
    .catch((err)=>{
      reject(err);
    })
  })
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

function decryptPrivateKey(walletUser) {
  const {base64EncryptedEOA} = walletUser;
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



function transferDeck(from, to, value, privateKey) {

  return new Promise(async (resolve, reject)=>{
    try{
      const transferMethod = DECK_CONTRACT.methods.transfer(to, value);
  
      const gasPrice = await web3.eth.getGasPrice();
      console.log("gasPrice", gasPrice);

      const nonce = await web3.eth.getTransactionCount(from);
      console.log("nonce", nonce);

      const estimateGas = await transferMethod.estimateGas({
        from: from
      });
      const gasLimit = Math.round(estimateGas);
      
      console.log("gasLimit", gasLimit);
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
      console.log("transferDeck", err);
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
    .once('transactionHash', function(hash){
      console.log("transactionHash", hash);
      //resolve({success: true, transactionHash: hash});
    }).once('receipt', function(receipt){
      console.log("receipt", receipt);
      resolve(receipt);
    })
  });
  

}

function checkDepositResult(tableName, query) {
  return new Promise((resolve, reject)=>{
    mongo.find(tableName, {query: query})
    .then((data)=>{
      if(data[0] && data[0].result){
        console.log("already deposit result saved", JSON.stringify(data[0].result));
        resolve(true);
      } else {
        resolve(false);
      }
        
    })
    .catch((err)=>{
      reject(err);
    })
  });  
}

function updateDepositResult(tableName, query, data){
  return new Promise(async (resolve, reject)=>{
    mongo.update(tableName, query, {$set: data})
    .then((data)=>{
      resolve(data);
     })
    .catch((err)=>{
      reject(err);
    })
  })
}