'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: 'us-west-1'});

module.exports = {
    uploadToS3,
    dowloadFromS3,
    writeFile,
    readFile,
    deleteDir,
    encodeBase64,
    gzip,
    unzip
}

function uploadToS3 (filepath, bucket, key, base64) {
    return new Promise(async (resolve, reject)=>{
        const stream = readFile(filepath);
        let streamBase64Compressed;
        if(base64){
            const streamBase64 = encodeBase64(stream);
            streamBase64Compressed = await gzip(streamBase64);
        }
        
        const data = await s3.putObject({
            Bucket: bucket, 
            Key: key,
            Body: base64?streamBase64Compressed:stream,
            ContentType: "application/octet-stream",
            ContentEncoding: base64?"gzip":undefined,
        }).promise();

        console.log("upload file", bucket, key);
        resolve({data, bucket, key});
        
    });
}

function dowloadFromS3 (workdir, bucket, key) {
    
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
            //console.log(filename, extname)
            
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
  

function encodeBase64(buffer){
    return buffer.toString("base64");
}
function gzip(buffer) {
    return new Promise((resolve, reject)=>{
        zlib.gzip(buffer, function(err, data){
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        })
    })
}

function unzip(buffer) {
    return new Promise((resolve, reject)=>{
        zlib.unzip(buffer, function(err, data){
            if(err){
                reject(err);
            } else {
                resolve(data);
            }
        })
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

function readFile (filepath){

    try {
        return fs.readFileSync(filepath)
    } catch (err) {
        console.error(err)
    }

}

function deleteDir(dirPath) {
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