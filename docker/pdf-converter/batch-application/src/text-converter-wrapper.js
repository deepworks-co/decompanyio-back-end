'use strict';
const childProcess = require('child_process')
const path = require('path');
const fs = require('fs');
module.exports = (event) => {
    

    return new Promise((resolve, reject)=>{
        //java -jar PolarisConverter8.jar TEXT rsa.ppt ./temp 1280 1280 ~/temp
        console.log(event);
        const {downloadPath, outputPath, w, h, extname} = event;
        const outputDir = `${path.join(downloadPath, "..")}/text`;
        const tempPath = `${path.join(downloadPath, "..")}/text_temp`;

        fs.mkdirSync(outputDir);
        fs.mkdirSync(tempPath);

        const args = [downloadPath, outputDir, w, h, tempPath];
        execEngine(args)
        .then(async (result)=>{
            const textpath = await makeTextJson(outputDir);
            resolve(textpath);
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
        let options = ["-jar", "PolarisConverter8.jar", "TEXT"].concat(payload);
            
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
                    //if(stdout) console.log("success stdout", JSON.stringify(stdout));
                    //if(stderr) console.log("success stderr", JSON.stringify(stderr));
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

function writeTextFile(filepath, jsonText){

    try {
        let parent = path.join(filepath, "..");
        if(!fs.existsSync(parent)){
            throw new Error("parent directory is not exists")
        } 

        fs.writeFileSync(filepath, jsonText);
        return true;
    } catch (err) {
        throw err;
    }
}

function makeTextJson(outputDir){
    return new Promise(async (resolve, reject)=>{
        const textJson = [];
        fs.readdir(outputDir, async (err, files) => {
            
            if(err){
                console.error(err);
                reject(err)
            }else {
                const promises = files.map(async (file) => {
                    const path = outputDir + '/' + file;
                    const text = await getText(path);
                    textJson[Number(file)-1] = text?text.trim():"";
                    return true
                });
                const t = await Promise.all(promises);

                writeTextFile(outputDir + "/text.json", JSON.stringify(textJson))
                resolve(outputDir + "/text.json");
            }
        })
        
    })
    
}

function getText(path){
    return new Promise((resolve, reject)=>{
        fs.readFile(path, function(err, buf){
            if(err) reject(err)
            else resolve(buf.toString())
        })
    })
}