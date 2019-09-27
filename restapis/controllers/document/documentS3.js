var AWS = require("aws-sdk");
const { s3Config } = require('decompany-app-properties');
const s3 = new AWS.S3();

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

 function getDocumentTextById(documentId){
  
  return new Promise((resolve, reject)=>{
    const key = 'THUMBNAIL/' + documentId + '/text.json';
    console.log("getDocumentTextById", bucketName, key)
    s3.getObject({
      Bucket: bucketName,
      Key: key
    }, (err, data)=>{
      if(err) {
        reject(err);
      } else {
        const resultText = JSON.parse(data.Body.toString("utf-8"));
        resolve(resultText);
      }
    })
  })
  
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

