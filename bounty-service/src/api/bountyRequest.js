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

  const bountyType = type==="deck"?"DECK":"GAS"
  let isSendBounty = false;


  const histories = await wapper.findAll(TB_BOUNTY, {
    accountId: principalId, 
    ethAccount: ethAccount, 
    bountyType: bountyType
  }, {created: -1}, 1);

  let amount;
  if(bountyType==="DECK"){
    amount = 1000 * Math.pow(10, 18);
    if(histories.length === 0) isSendBounty = true;
  } else {
    amount = 0.1 * Math.pow(10, 18);
    const history = histories[0];   
    const timestamp = Date.now() - (1000 * 60 * 60 * 24); //yesterday
    const sent = history && history.sent?history.sent:0;
    const state = history && history.state?history.state:"PENDING";
    console.log("");
    console.log(bountyType, "sent", new Date(sent), "histroy", history);

    if(!history || (state === "SENT" && sent  < timestamp)) isSendBounty = true;
  }

  if(isSendBounty){
    const result = await wapper.insert(TB_BOUNTY, {
      accountId: principalId,
      ethAccount: ethAccount,
      bountyType: bountyType,
      state: "PENDING",
      amount: amount,
      created: Date.now()
    });
  } else {
    message = "no bounty"
  }
  
  const response = JSON.stringify({
    success: true,
    message: message,
    lastHist: histories
  });

  return response;

};