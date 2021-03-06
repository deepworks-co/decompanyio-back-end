'use strict';
const childProcess = require('child_process')
const path = require('path');
const fs = require('fs');
module.exports = (event) => {
    

    return new Promise((resolve, reject)=>{

        const {downloadPath, outputPath, w, h, extname} = event;
        if(extname && extname.toLowerCase() === ".pdf" ){            
            reject(new Error(`source is pdf file : ${downloadPath}`));
        } else {
            const tempPath = `${path.join(downloadPath, "..")}/temp`;
            const args = [downloadPath, outputPath, w, h, tempPath];
            execEngine(args)
            .then((result)=>{
                const response = Object.assign(event, {
                    success: result.stderr?false:true,
                    outputPath: outputPath
                });
                
                resolve(response);
            })
            .catch((err)=>{
                console.error(`Error Executing Engine ${JSON.stringify(err)}`);
                
                writeFalseFile(outputPath);
                const response = Object.assign(event, {
                    success: false
                });
                resolve(response)
            });
        }

        
    });
    
}


function execEngine(payload){

    return new Promise((resolve, reject)=>{
        let options = ["-jar", "PolarisConverter8.jar", "PDF"].concat(payload);
            
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