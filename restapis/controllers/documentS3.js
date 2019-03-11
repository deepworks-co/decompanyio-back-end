var AWS = require("aws-sdk");

const endpoint = new AWS.Endpoint("s3.us-west-1.amazonaws.com");
var s3 = new AWS.S3({endpoint: endpoint});

const  bucketName = "dev-ca-document";

module.exports = {
  getDocumentTextById,
  getDocumentText,
  generateSignedUrl
}
/*
function getDocumentText(documentId, totalPageNo){

  console.log(documentId, totalPageNo);
  const promises = [];
  const resultTexts = []; 

  for(let i=0;i<totalPageNo;i++){
    resultTexts[i] = i+1;
  }
  
  resultTexts.forEach((item, index)=>{
    const params = {
      Bucket: bucketName,
      Key: 'THUMBNAIL/' + documentId + '/text/'
    }
    console.log(params);
    promises.push(s3.getObject(params).promise());
  })
  
  return new Promise((resolve, reject) => {
    Promise.all(promises).then((data)=>{
      resolve(data);
    }).catch((err)=>{
      console.log(err);
      reject(err);
    })
  }); 

}
*/
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

  const params = {
    Bucket: bucketName,
    Key: 'THUMBNAIL/' + documentId + '/document.txt'
  }
  const textBuffer = await s3.getObject(params).promise();
  const textString = textBuffer.Body.toString("utf-8").substring(0, 3000);
  return textString;

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

