'use strict';
const uuidv4 = require('uuid/v4');

const documentService = require('./documentMongoDB');
const documentS3 = require('./documentS3');
const {utils, s3} = require('decompany-common-utils');
const {region, s3Config} = require('decompany-app-properties');


var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
}
module.exports.list = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event", JSON.stringify(event));

  const params = event.method === "POST"?event.body:event.query;

  console.log("parameters", params);
  
  const pageNo = isNaN(params.pageNo)?1:Number(params.pageNo);
  const pageSize = isNaN(params.pageSize)?10:Number(params.pageSize);
  let accountId = params.accountId?decodeURI(params.accountId):null;
  const email = params.email?decodeURI(params.email):null;
  const username = params.username?decodeURI(params.username):null;
  const tag = params.tag;
  const path = params.path;
  const skip = ((pageNo - 1) * pageSize);

  const totalViewCountInfo = await documentService.getRecentlyPageViewTotalCount();

  if(!accountId && email){
    const user = await documentService.getUser({email:email});
    console.log("by email", user);
    accountId = user._id;
  } else if(!accountId && username) {
    const user = await documentService.getUser({username:username});
    console.log("by username", user);
    accountId = user._id;
  }

  const resultList = await documentService.queryDocumentList({
    pageNo: pageNo,
    accountId: accountId,
    tag: tag,
    path: path,
    pageSize: pageSize,
    skip: skip
  });
  
  return (null, JSON.stringify({
    success: true,
    resultList: resultList,
    pageNo: pageNo,
    count: resultList.length,
    totalViewCountInfo: totalViewCountInfo?totalViewCountInfo:null
  }));


};