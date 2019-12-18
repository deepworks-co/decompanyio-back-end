'use strict';
const childProcess = require('child_process')
const path = require('path');
const fs = require('fs');
module.exports = (event) => {
    

    return new Promise((resolve, reject)=>{
        //java -jar PolarisConverter8.jar TEXT rsa.ppt ./temp 1280 1280 ~/temp
        const {downloadPath, outputPath, w, h, extname} = event;
        const outputDir = `${path.join(downloadPath, "..")}/image`;
        const tempPath = `${path.join(downloadPath, "..")}/image_temp`;

        fs.mkdirSync(outputDir);
        fs.mkdirSync(tempPath);

        const args = [downloadPath, outputDir, 4096, 4096, tempPath];
        execEngine(args)
        .then(async (result)=>{
            const paths = await getImagePaths(outputDir);            
            resolve(paths);
        })
        .catch((err)=>{
            console.error(`Error Executing Engine ${JSON.stringify(err)}`);
            
            const response = Object.assign(event, {
                success: false
            });
            resolve(response)
        });

    });
    
}


function execEngine(payload){
    //java -jar PolarisConverter8.jar TEXT rsa.ppt ./temp 1280 1280 ~/temp
    return new Promise((resolve, reject)=>{
        let options = ["-jar", "PolarisConverter8.jar", "PNG"].concat(payload);
            
        console.log("execEngine", "java", options.join(" "));
        const cp = childProcess.execFile(
            'java',
            options,
            {cwd: '/converter'},
            (err, stdout, stderr) => {
                if(err){
                    console.error("execEngine Error", JSON.stringify(err));
                    if(stdout) console.log("stdout", JSON.stringify(stdout));
                    if(stderr) console.log("stderr", JSON.stringify(stderr));
                    
                    reject(err);
                } else {
                    //if(stdout) console.log("stdout", JSON.stringify(stdout));
                    //if(stderr) console.log("stderr", JSON.stringify(stderr));
                    resolve(true)
                }
            }
        )
        //console.log("cp", cp);
        /*cp.stderr.on('data', (data) => console.error("[exec error]", data))
        cp.stdout.on('data', (data) => console.log("[exec]", data))
        
        cp.on('close', (code) => console.log("exec close", code));//process.exit(code))
        */
 
    })
    
}

function writeFalseFile(filepath){

    try {
        let parent = path.join(filepath, "..");
        if(!fs.existsSync(parent)){
            throw new Error("parent directory is not exists")
        } 

        fs.writeFileSync(filepath, "false");
        return true;
    } catch (err) {
        throw err;
    }
}

function getImagePaths(dir){
    return new Promise((resolve, reject)=>{
        fs.readdir(dir, async (err, files) => {
            if(err) {
                reject(err);
            }
            else {
                resolve(files.map((file)=>dir + "/" + file))
            };
        });
    })
}