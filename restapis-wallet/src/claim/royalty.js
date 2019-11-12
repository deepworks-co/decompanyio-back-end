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
  const {documentId} = body;

  try{

    const isRegistry = await isRegistryDocument(documentId);

    if(isRegistry===false){
      throw new Error(`${documentId} is not registry!`);
    }

    const check = await checkClaimReward({
      documentId: documentId,
      userId: principalId
    });

    let success = false;
    if(check){
      const result = await addClaimReward({
        documentId: documentId,
        userId: principalId
      })

      success = true;
    } 
    

    return JSON.stringify({
      success: success
    })
  } catch (err){
    console.error(err);
    return callback(`[500] ${err.toString()}`);
  }

};

function isRegistryDocument(documentId){
  return new Promise((resolve, reject)=>{
    mongo.findOne(tables.DOCUMENT, {_id: documentId}).then((data)=>{

      if(data.registry){
        resolve(true);
      } else {
        resolve(false)
      }
    }).catch((err)=>{
      reject(err);
    })
  })
}

/**
 * 
 * @param {*} params 
 */
function addClaimReward(params){
  const {documentId, userId} = params
  return new Promise(async (resolve, reject)=>{
    mongo.insert(tables.CLAIM_ROYALTY, {
      documentId,
      userId,
      created: Date.now()
    }).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      reject(err);
    });



  });
}


/**
 * @name getLatestClaim
 * @param {*} params 
 */
function checkClaimReward(params){
  const {documentId, userId} = params
  return new Promise(async (resolve, reject)=>{

    try{
      const claimList = await mongo.find(tables.CLAIM_ROYALTY, {
        query: {
          documentId,
          userId,
          result: {$exists: false}
        }
      })

      let requestClaimAvailable = false;
      if(claimList.length===0){
        requestClaimAvailable = true;
      }

      resolve({success: requestClaimAvailable});
    } catch(err){
      reject(err);
    }
    
  });
}