const { mongodb, tables} = require('decompany-app-properties')
const { MongoWrapper } = require('decompany-common-utils')


/**
 * 
 * @param {*} eventParams 
 * @description 
 {
    type,
    path,
    method,
    header : {
        userAgent,
        sourceIp,
        cookie
    }
    payload
}
 */


function saveEvent(eventParams, wrapper) {

    return new Promise((resolve, reject)=>{
        if(!eventParams.type || !eventParams.path || !eventParams.headers){
            throw new Error("event paramter is invaild : " + JSON.stringify(eventParams));
        }
        const createdAt = new Date();
        wrapper.save(tables.EVENT, Object.assign(eventParams, {
            created: createdAt.getTime(),
            createdAt: createdAt
        }))
        .then((data)=>{
            resolve(data);
        }).catch((err)=>{
            reject(err);
        })

    })
}

module.exports = {
    saveEvent
}