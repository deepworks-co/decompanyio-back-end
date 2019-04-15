const AWS = require("aws-sdk");

exports.decrypt = (region, cipherText) => {
    const kms = new AWS.KMS({region: region});
    return new Promise((resolve, reject) => {
        const params = {
            CiphertextBlob: cipherText
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