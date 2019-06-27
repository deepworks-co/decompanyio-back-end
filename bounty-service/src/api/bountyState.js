'use strict';

const { mongodb, tables} = require('decompany-app-properties');
const { utils, MongoWapper} = require('decompany-common-utils');

const TB_BOUNTY = tables.BOUNTY;
const TB_USER = tables.USER;

module.exports.handler = async (event, context, callback) => {

  const {query, principalId} = event;
  const {ethAccount, type} = query;
  let message = "ok";
  if(!ethAccount){
    throw new Error("ethereum account is null");
  }

  const wapper = new MongoWapper(mongodb.endpoint);

  const user = await wapper.findOne(TB_USER, {_id: principalId});

  if(!user || user.ethAccount !== ethAccount){
    throw new Error("user is invalid");
  }

  console.log("user", user);



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

  
  const response = JSON.stringify({
    success: true,
    deck: deckHist,
    gas: gasHist
  });

  return response;

};