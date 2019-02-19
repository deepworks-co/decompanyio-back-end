var AWS = require("aws-sdk");


/**
 * @param regions : 
 * @param streamName : 
 * @param PartitionKey :
 * @param body :
 */
exports.putRecord = (region, streamName, PartitionKey, body) => {
    
    const kinesis = new AWS.Kinesis({region: region});

    return new Promise((resolve, reject) =>{
        var params = {
            StreamName: streamName,
            Data: JSON.stringify(body),
            PartitionKey: PartitionKey
        };
        kinesis.putRecord(params, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }   
        });
    });

    
 }