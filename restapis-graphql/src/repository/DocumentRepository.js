'use strict';
const {Document, UserDocumentHistory} = require('../mongoose/model');

module.exports = {
    getDocument
}

function getDocument(root, {input}){
    
    return new Promise((resolve, reject)=>{
        
        Document.findById(input, (err, data)=>{
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
        
    })
}

function getUserDocumentHistories(root, {input}){
    
    return new Promise((resolve, reject)=>{
        
        UserDocumentHistory.aggregate(input, (err, data)=>{
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        })
        
    })
}