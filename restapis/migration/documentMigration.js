'use strict';
const {utils, MongoWapper, sqs} = require('decompany-common-utils');
const { mongodb, tables, sqsConfig} = require('../resources/config.js').APP_PROPERTIES();

const TB_DOCUMENT = tables.DOCUMENT;

/**
 * @description 
 * 1시간마다 전체 문서의 VoteAmount를 가져오기 위한 SQS생성함
 * 
 */
module.exports.handler = async (event, context, callback) => {
  
  const wapper = new MongoWapper(mongodb.endpoint);
  const resultList = await wapper.findAll(TB_DOCUMENT, {state: "CONVERT_COMPLETE"});

  const promises = resultList.map((result)=>{
    return sendMessageConvertDoc(result);
  })

  await Promise.all(promises);

  console.log(promises);

  wapper.close();

 
  return (null, "success");
  
};

function sendMessageConvertDoc(doc){
  /**
   * {"command":"image","filePath":"dev-ca-document/FILE/0x8B1D39Cd838B6ceBA4ef2475994c6fc66fD1E100/e94496d0c8e947ad8d337d51ac0bc03c.pdf","storagePath":"dev-ca-document/THUMBNAIL/e94496d0c8e947ad8d337d51ac0bc03c","resolutionX":1200,"resolutionY":1200,"startPage":1,"endPage":10,"accesskey":"","secretKey":"","ext":"pdf","owner":"0x8B1D39Cd838B6ceBA4ef2475994c6fc66fD1E100"}
   */

  const exts = doc.documentName.substring(doc.documentName.lastIndexOf(".") + 1);
  const messageBody = JSON.stringify({
    command: "image",
    filePath: "dev-ca-document/FILE/" + doc.accountId + "/" + doc._id +"."+ exts,
    storagePath: "dev-ca-document/THUMBNAIL/" + doc._id,
    "resolutionX":1200,
    "resolutionY":1200,
    "startPage":1,
    "endPage":10,
    "ext": exts,
    "owner": doc.accountId
  });
  console.info("sendMessageConvertDoc", messageBody);
  const queueUrl = sqsConfig.queueUrls.CONVERT_IMAGE;
  
  //return sqs.sendMessage(sqsConfig.region, queueUrl, messageBody);
}

