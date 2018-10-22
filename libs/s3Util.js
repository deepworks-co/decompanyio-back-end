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



}
