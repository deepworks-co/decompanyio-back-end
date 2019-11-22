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
  let savedVoteDoc;
  try{

    const user = await getWalletAccount(principalId);

    if(!user){
      throw new Error(`[500] User is not found`);
    }

    const doc = await getDocumentFromMongoDB(documentId);
    if(!doc){
      throw new Error(`[500] document does not exists. document id ${documentId}`);
    }

    const gasBalance = await web3.eth.getBalance(user.address);
    console.log(`${user.address} gas balance`, gasBalance);

    const deckBalance = await DECK_CONTRACT.methods.balanceOf(user.address).call();
    console.log(`${user.address} deck balance`, deckBalance);
    const voteAmount = Number(web3.utils.toWei(amount + "", "ether"));

    
    if(voteAmount > deckBalance){
      throw new Error("The Vote value has exceeded the current deck value.");
    }

    savedVoteDoc = await saveVoteToMongoDB({
      documentId: documentId, 
      userId: principalId, 
      deposit: Number(voteAmount), 
      status: "PENDING",
      created: Date.now()
    });

    
    const allowance = await DECK_CONTRACT.methods.allowance(user.address, BALLOT_CONTRACT.address).call({from: user.address});
    console.log(`${user.address} allowance`, allowance);
    
    if(voteAmount>allowance){
      const approveTransaction = await approveOnChain({
        from: user,
        documentId: documentId,
        voteAmount: deckBalance
      })
      console.log("approve", approveTransaction)
    }
    
    const transactionResult = await voteOnChain({
      from: user,
      documentId: documentId,
      voteAmount: voteAmount
    })

    if(transactionResult.pendingTransaction && transactionResult.pendingTransaction === true){
      console.log("pending transaction, remove vote data", savedVoteDoc);
      await removeVoteFromMongoDB(savedVoteDoc);
      return JSON.stringify({success: false, transactionResult});
    }

    if(!transactionResult.transactionHash){
      throw new Error("[500] Error Vote Transaction")
    }

    console.log("voteOnChain transaction", transactionResult);

    await saveVoteToMongoDB({
      _id: savedVoteDoc._id,
      updateData: {
        transaction: transactionResult,
        status: "COMPLETE",
        update: Date.now()
      }
      
    });

    return JSON.stringify({
      success: true,
      result: transactionResult
    })

  } catch (err){
    console.error(err);
    await saveVoteToMongoDB({
      _id: savedVoteDoc._id,
      updateData: {
        status: "ERROR",
        error: err.toString(),
        update: Date.now()
      }
      
    });
    throw new Error(`[500] ${err.toString()}`);
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

function approveOnChain(params) {
  const {from, documentId, voteAmount} = params;
  console.log("approveOnChain parameter", params);

  return new Promise(async (resolve, reject)=>{
    try{
      console.log("ballot address", BALLOT_CONTRACT.address)
      const approveMethod = DECK_CONTRACT.methods.approve(BALLOT_CONTRACT.address, voteAmount+"");
      const encodeABI = approveMethod.encodeABI();
      const estimateGas = await approveMethod.estimateGas({
        from: from.address
      });
      const gasLimit = Math.round(estimateGas);
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(from.address);
      const pendingNonce = await web3.eth.getTransactionCount(from.address, "pending");

      console.log({gasLimit, gasPrice, nonce, pendingNonce});

        //creating raw tranaction
      const rawTransaction = {
        "nonce": web3.utils.toHex(nonce),
        "gasPrice": web3.utils.toHex(gasPrice),
        "gasLimit": web3.utils.toHex(gasLimit),      
        "to": DECK_CONTRACT.address,
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
      console.log("documentId", documentId, "to hex", hexOfDocumentId, "voteAmount", voteAmount);

      const {dateMillis, creator, hashed} = await getDocument({hexOfDocumentId});

      if(!(from.address === creator && dateMillis>0)){
        throw new Error(`${documentId} document is not exsits in psnetwork`)
      }
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(from.address);
      const pendingNonce = await web3.eth.getTransactionCount(from.address, "pending");
      console.log({gasPrice, nonce, pendingNonce});

      if(pendingNonce > nonce){
        //throw new Error('pending transaction error');
        const msg = {pendingTransaction: true, message: 'pending transaction error', nonce, pendingNonce};
        console.log(msg)
        return resolve(msg);
      }

      const contractAddress = BALLOT_CONTRACT.address;
      const voteMethod = BALLOT_CONTRACT.methods.addVote(hexOfDocumentId, voteAmount+"");
      const encodeABI = voteMethod.encodeABI();
      const estimateGas = await voteMethod.estimateGas({
        from: from.address
      });
      const gasLimit = Math.round(estimateGas);
      

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
      const r = await sendTransaction(privateKey, rawTransaction, true);
      resolve(r);
    } catch (err) {
      reject(err);
    }
  })

}


function sendTransaction(privateKey, rawTransaction, onlyTransactionHash) {

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
      if(onlyTransactionHash===true) resolve({transactionHash: hash});      
    }).once('receipt', function(receipt){
      console.log("receipt", receipt);
  
      resolve(receipt);      
    }).on('error', function(err){
      reject(err);
    });
  });
  

}

/**
 * @name saveVoteToMongoDB
 * @param {string} documentId document Id
 * @param {string} userId sns id
 * @param {number} value input value * e-18
 */
function saveVoteToMongoDB(params){
  const {_id, updateData} = params;

  return new Promise(async (resolve, reject)=>{

    if(_id){
      mongo.update(tables.VOTE, {_id}, {$set: updateData}).then((data)=>{
        resolve(data);
      }).catch((err)=>{
        reject(err);
      })

    } else {
      mongo.insert(tables.VOTE, params).then((data)=>{
        resolve(data);
      }).catch((err)=>{
        reject(err);
      })
    }

    
    
  })
}

function removeVoteFromMongoDB(vote){
  const {_id} = vote;

  return new Promise(async (resolve, reject)=>{

    if(_id){
      mongo.removeOne(tables.VOTE, {_id}).then((data)=>{
        resolve(data);
      }).catch((err)=>{
        reject(err);
      })

    }
  })
}

/**
 * 
 * @param {object} params 
 */
function getDocument(params){

  const {hexOfDocumentId} = params;

  return new Promise(async (resolve, reject)=>{
    try{
      const r = await REGISTRY_CONTRACT.methods.getDocument(hexOfDocumentId).call()
      resolve({
        dateMillis: Number(r[0]),
        creator: r[1],
        hashed: r[2]
      });
    }catch(err){
      reject(err);
    }
    
  })
  
}

function getDocumentFromMongoDB(documentId) {
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{
      
      resolve(data);
    }).catch((err)=>{
      reject(err);
    })
    
  })
}