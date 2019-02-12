var AWS = require("aws-sdk");


/**
 * @param regions : 
 * @param deliveryStreamName : 
 * @param body :
 */
exports.putRecord = (region, deliveryStreamName, body) => {
    //const firehose = new AWS.Firehose({apiVersion: '2015-08-04'});

    const firehose = new AWS.Firehose({region: region});

    return new Promise((resolve, reject) =>{
        var params = {
            DeliveryStreamName: deliveryStreamName, /* required */
            Record: { /* required */
                Data: JSON.stringify(body) /* Strings will be Base-64 encoded on your behalf */ /* required */
            }
        };
        firehose.putRecord(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }   
        });
    });

    
 }