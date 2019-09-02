'use strict';
const {User} = require('../mongoose/model');

module.exports = {
    getUser
}

function getUser(root, {input}){
    return new Promise((resolve, reject)=>{
        console.log("getUser");
        User.findById(input, (err, data)=>{
            if(err) {
                reject(err);
            } else {
                console.log("getUser result", data);
                resolve(data);
            }

        })
        
    })
}
