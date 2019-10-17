'use strict';

const {tables, region} = require("decompany-app-properties");
const {kms} = require("decompany-common-utils");

module.exports = (context, params) => {
  const {wallet, mongo} = context;
  const {deck, principalId, to} = params;

  return new Promise((resolve, reject)=>{
    getWalletAccount(mongo, principalId)
    .then(async (sender)=>{
      console.log("get sender", sender);
      const recipient = await getWalletAccount(mongo, to);
      return {sender, recipient};
    })
    .then(async (data)=>{
      const {sender} = data;
      const balance = await wallet.getDeckBalance(sender.address)
      console.log("sender balance ", sender.address, balance);
      return data;
    })
    .then(async (data)=>{
  
      const {sender} = data;
      const privateKey = await decryptPrivateKey(sender)
      
      data.deck = deck;
      data.privateKey = privateKey;
      return transferDeck(wallet, data)
    })
    .then((data)=>{
      console.log("transfer complete", data);
      resolve(data);
    })
    .catch((err)=>{
      console.log("deck transfer error", err);
      reject(err);
    })
  })
  
}

function getWalletAccount(mongo, userId){

  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.WALLET_USER, {_id: userId})
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    })
  })
}


function decryptPrivateKey(walletUser) {
  const {principalId, address, base64EncryptedEOA} = walletUser;
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

function transferDeck(wallet, params) {

  const {sender, recipient, privateKey, deck} = params;
  
  return wallet.transferDeck(
    {
      address: sender.address, 
      privateKey
    }, {
      address: recipient.address
    }, 
    deck);
}

