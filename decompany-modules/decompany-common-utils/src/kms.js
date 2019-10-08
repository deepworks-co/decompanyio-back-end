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

exports.encrypt = (region, keyId, plainText) => {
    const kms = new AWS.KMS({region: region});
    return new Promise((resolve, reject) => {
        const params = {
            KeyId: keyId,
            Plaintext: plainText
        }

        kms.encrypt(params, function(err, data) {
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        })
        
    });
}