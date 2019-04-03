const AWS = require("aws-sdk");
const kms = new AWS.KMS();
exports.decrypt = (cipherText) => {
    return new Promise((resolve, reject) => {
        const params = {
            CiphertextBlob: ""
        }

        kms.decrypt(params, function(err, data) {
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        })
        
    });
}