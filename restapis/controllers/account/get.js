'use strict';
const AccountService = require('./AccountService');
const { utils, MongoWapper} = require('decompany-common-utils');
const { tables, mongodb, constants} = require('decompany-app-properties');
module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  
  console.log(JSON.stringify(event));
  const {principalId, query} = event;

  const accountService = new AccountService();
  let user = null;

  user = await accountService.getUserInfo({
    id: principalId
  });

  if(!user){
    throw new Error("user does not exist... " + JSON.stringify(query));
  }
  const response = {
    success: user?true:false,
    user: user
  };

  const privateDocumentCount = await getPrivateDocumentCount(principalId);
  response.privateDocumentCount = privateDocumentCount;

  if(user.ethAccount){
    const ethAccount = user.ethAccount;
    const TB_BOUNTY = tables.BOUNTY;
    const wapper = new MongoWapper(mongodb.endpoint);
    const deckHist = await wapper.findAll(TB_BOUNTY, {
      accountId: principalId, 
      ethAccount: ethAccount, 
      bountyType: "DECK"
    }, {created: -1}, 1);
  
    const gasHist = await wapper.findAll(TB_BOUNTY, {
      accountId: principalId, 
      ethAccount: ethAccount, 
      bountyType: "GAS"
    }, {created: -1}, 1);
    wapper.close();

    response.gas = gasHist;
    response.deck = deckHist;
  }
  
  return JSON.stringify(response);
};


function getPrivateDocumentCount(accountId){

  return new Promise(async (resolve, reject)=>{
    const wapper = new MongoWapper(mongodb.endpoint);

    wapper.query(tables.DOCUMENT, { state: {$ne: constants.DOCUMENT.STATE.CONVERT_FAIL}, isBlocked: false, isDeleted: false , isPublic: false, accountId: accountId})
    .sort({created:-1}).toArray((err, data)=>{
      if(err) {
        reject(err);
      } else {
        console.log("get private doc", data);
        resolve(data.length);
      }
      wapper.close();
    });

  })

}