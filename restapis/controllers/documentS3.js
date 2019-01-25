var AWS = require("aws-sdk");

const endpoint = new AWS.Endpoint("s3.us-west-1.amazonaws.com");
var s3 = new AWS.S3({endpoint: endpoint});

const  bucketName = "dev-ca-document";

module.exports = {
  getDocumentTextById : getDocumentTextById = (documentId) => {

    const params = {
      Bucket: bucketName,
      Key: 'THUMBNAIL/' + documentId + '/document.txt'
    }
    console.log("getDocumentTextById", params);
    return s3.getObject(params).promise();

  },

  generateSignedUrl : generateSignedUrl = (accountId, documentId, ext) => {

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
}
