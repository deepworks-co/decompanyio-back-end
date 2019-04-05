var AWS = require("aws-sdk");
const { s3Config } = require('../../resources/config.js').APP_PROPERTIES();
const endpoint = new AWS.Endpoint("s3.us-west-1.amazonaws.com");
var s3 = new AWS.S3({endpoint: endpoint});

const  bucketName = s3Config.document;

module.exports = {
  getDocumentTextById,
  getDocumentText,
  generateSignedUrl
}

async function getDocumentText(documentId, pageNo){

  console.log(documentId, pageNo);
  const params = {
    Bucket: bucketName,
    Key: 'THUMBNAIL/' + documentId + '/text/' + pageNo
  }
  console.log(params);
  const result = await s3.getObject(params).promise();


  console.log(result);
}

async function getDocumentTextById(documentId){
  let resultText;
  
  if(!resultText){
    const textBuffer = await s3.getObject({
      Bucket: bucketName,
      Key: 'THUMBNAIL/' + documentId + '/text.json'
    }).promise();
    resultText = JSON.parse(textBuffer.Body.toString("utf-8"));
  }
  return resultText;
}

function generateSignedUrl (accountId, documentId, ext) {

  const myKey = "FILE/" + accountId + "/" + documentId + "." + ext;
  const signedUrlExpireSeconds = 60 * 5

  const url = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: myKey,
      Expires: signedUrlExpireSeconds
  })

  console.log("Generate Signed Url", url)
  return url;
}

