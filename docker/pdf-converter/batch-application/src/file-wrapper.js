'use strict';
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: 'us-west-1'});

module.exports.uploadToS3 = (filepath, bucket, key) => {
    return new Promise((resolve, reject)=>{
        const stream = readFile(filepath)
        s3.putObject({
            Bucket: bucket, 
            Key: key,
            Body: stream,
            ContentType: "octet-stream"

        }, function(err, data) {
            if(err){
                reject(err);
            } else {
                console.log("upload file", bucket, key);
                resolve({data, bucket, key});
            }
        })
    });
}
module.exports.dowloadFromS3 = (workdir, bucket, key) => {
    
    return new Promise((resolve, reject) => {
      s3.getObject({
        Bucket: bucket,
        Key: key
      }, function(err, data){
        if(err) {
            console.error(err);
            reject(new Error(`Fail download file from S3 (${bucket}/${key})`));
        } else {
            
            const extname = path.extname(key)
            const filename = path.basename(key);
            
            const tempPath = workdir + `/temp${extname}`;
            console.log(filename, extname)
            
            makeDir(workdir);

            if(!writeFile(tempPath, data.Body)){
                reject(new Error(`create file fail ${tempPath}`));
            }

            console.log("download from s3", bucket, key, tempPath);
            resolve({downloadPath: tempPath, extname: extname, filename: filename});
            
        }
      });
    })
  }

function makeDir(dir) {

    if (!path.isAbsolute(dir)) return;

    let parent = path.join(dir, "..");
    
    if(parent !== path.join("/") && !fs.existsSync(parent)){
        console.log(parent, fs.existsSync(parent));
        makeDir(parent)
    } 

    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log("Created", dir);
    }

} 

function writeFile(filepath, data){

    try {
        let parent = path.join(filepath, "..");
        if(!fs.existsSync(parent)){
            throw new Error("parent directory is not exists")
        } 

        fs.writeFileSync(filepath, data);
        return true;
    } catch (err) {
        throw err;
    }
}

function readFile(filepath){

    try {
        return fs.readFileSync(filepath)
    } catch (err) {
        console.error(err)
    }

}

module.exports.deleteDir = function(dirPath) {
    if( fs.existsSync(dirPath) ) {
      fs.readdirSync(dirPath).forEach(function(file,index){
        var curPath = dirPath + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  };