'use strict';
const {stage, mongodb, tables, region, walletConfig} = require("decompany-app-properties");
const {kms, sns, MongoWrapper} = require("decompany-common-utils");
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');
const {buildContract} = require('../ContractUtils');

const web3 = new Web3(walletConfig.psnet.providerUrl);
const mongo = new MongoWrapper(mongodb.endpoint);

const PSNET_BALLOT_ABI = require(`../../psnet/${stage}/Ballot.json`)
const PSNET_DECK_ABI = require(`../../psnet/${stage}/ERC20.json`)
const PSNET_REGISTRY_ABI = require(`../../psnet/${stage}/Registry.json`)
const NETWORK_ID = walletConfig.psnet.id;

const DECK_CONTRACT = buildContract(web3, PSNET_DECK_ABI, NETWORK_ID);
const BALLOT_CONTRACT = buildContract(web3, PSNET_BALLOT_ABI, NETWORK_ID);
const REGISTRY_CONTRACT = buildContract(web3, PSNET_REGISTRY_ABI, NETWORK_ID);

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
  const {documentId, amount} = body;

  try{

    const user = await getWalletAccount(principalId);

    if(!user){
      throw new Error(`[500] User is not found`);
    }

    const gasBalance = await web3.eth.getBalance(user.address);
    console.log(`${user.address} gas balance`, gasBalance);

    const deckBalance = await DECK_CONTRACT.methods.balanceOf(user.address).call();
    console.log(`${user.address} deck balance`, deckBalance);
    const voteAmount = Number(web3.utils.toWei(amount + "", "ether"));

    
    if(voteAmount > deckBalance){
      throw new Error("The Vote value has exceeded the current deck value.");
    }

    const transactionResult = await voteOnChain({
      from: user,
      documentId: documentId,
      voteAmount: voteAmount
    })

    if(!transactionResult.transactionHash){
      throw new Error("[500] Error Vote Transaction")
    }

    const saveResult = await voteOnMongoDb(documentId, principalId, value, transactionResult.transactionHash);

    console.log("vote result", {saveResult, transactionResult});

    return JSON.stringify({
      success: true,
      result: transactionResult
    })

  } catch (err){
    console.error(err);
    return callback(`[500] ${err.toString()}`);
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
      //console.log("decryptPrivateKey", data.Plaintext.toString("utf-8"));
      const privateKeyBuffer = new Buffer(privateKey.substring(2), 'hex')
      resolve(privateKeyBuffer);
    })
    .catch((err)=>{
      console.log(err);
      reject(err);
    })
    
  });
  
}

/**
 * @name voteOnChain
 * @parameter params {from: object {_id, address, base64EncryptedEOA}, hexOfDocumentId: hex string, value: number}  
*/
function voteOnChain(params){

  const {from, documentId, voteAmount} = params;
  console.log("voteOnChain parameter", params);

  return new Promise(async (resolve, reject)=>{
    try{
      const hexOfDocumentId = web3.utils.asciiToHex(documentId);
      console.log("documentId", documentId, "to hex", hexOfDocumentId);

      const {dateMillis, creator, hashed} = await getDocument({hexOfDocumentId});

      if(!(from.address === creator && dateMillis>0)){
        throw new Error(`${documentId} document is not exsits in psnetwork`)
      }
      
      const contractAddress = BALLOT_CONTRACT.address;
      const voteMethod = BALLOT_CONTRACT.methods.addVote(hexOfDocumentId, voteAmount+"");
      const encodeABI = voteMethod.encodeABI();
      const estimateGas = await voteMethod.estimateGas({
        from: from.address
      });
      const gasLimit = Math.round(estimateGas);
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(from.address);
      const pendingNonce = await web3.eth.getTransactionCount(from.address, "pending");

      console.log({gasLimit, gasPrice, nonce, pendingNonce, contractAddress});

        //creating raw tranaction
      const rawTransaction = {
        "nonce": web3.utils.toHex(nonce),
        "gasPrice": web3.utils.toHex(gasPrice),
        "gasLimit": web3.utils.toHex(gasLimit),      
        "to": contractAddress,
        "value": "0x0",
        "data": encodeABI
      }

      console.log("rawTransaction", rawTransaction);
      const privateKey = await decryptPrivateKey(from.base64EncryptedEOA); 
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
      resolve({transactionHash: hash});      
    }).once('receipt', function(receipt){
      console.log("receipt", receipt);
      //resolve(receipt);      
    })
  });
  

}

/**
 * @name voteOnMongoDb
 * @param {string} documentId document Id
 * @param {string} userId sns id
 * @param {number} value input value * e-18
 */
function voteOnMongoDb(documentId, userId, value){
  return new Promise((resolve, reject)=>{
    mongo.insert(tables.VOTE, {
      documentId: documentId,
      userId: userId,
      deposit: value,
      created: Date.now()
    }).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
    
  })
}

/**
 * 
 * @param {object} params 
 */
function getDocument(params){

  const {hexOfDocumentId} = params;

  return new Promise(async (resolve, reject)=>{
    const r = await REGISTRY_CONTRACT.methods.getDocument(hexOfDocumentId).call()
    resolve({
      dateMillis: Number(r[0]),
      creator: r[1],
      hashed: r[2]
    });
  })
  
}