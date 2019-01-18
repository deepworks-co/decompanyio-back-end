var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-1"
});

var s3 = new AWS.S3();
const  bucketName = "dev-ca-document";

module.exports = {
  getDocumentTextById : getDocumentTextById = (documentId) => {

    const params = {
      Bucket: bucketName,
      Key: 'THUMBNAIL/' + documentId + '/document.txt'
    }

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
