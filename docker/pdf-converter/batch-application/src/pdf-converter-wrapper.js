'use strict';
const childProcess = require('child_process')
const path = require('path');

module.exports = (event) => {
    const {extname} = event;
    if(extname && extname.toLowerCase() === ".pdf" ){
        const response = Object.assign({
            success: true,
            result: "source is pdf file",
        }, event);
        
        resolve(response);
    }

    return new Promise((resolve, reject)=>{
        const {downloadPath, outputPath, w, h} = event;
        const tempPath = `${path.join(downloadPath, "..")}/temp`;
        const args = [downloadPath, outputPath, w, h, tempPath];
        execEngine(args)
        .then((result)=>{
            const response = Object.assign({
                success: result.stderr?false:true,
                result: result,
            }, event);
            
            resolve(response);
        })
        .catch((err)=>{
            reject(new Error(`Error Executing Engine ${JSON.stringify(err)}`));
        });
    });
    
}


function execEngine(payload){

    return new Promise((resolve, reject)=>{
      
        let options = ["-jar", "PolarisConverter8.jar", "PDF"].concat(payload);
            
        console.log("java", options.join(" "));
        const cp = childProcess.execFile(
            'java',
            options,
            {cwd: '/converter'},
            (err, stdout, stderr) => {
                if(err){
                    console.error(err);
                    reject(err);
                } else {
                    resolve({stdout, stderr});
                }
            }
        )
        //console.log("cp", cp);
        /*cp.stderr.on('data', (data) => console.error("[exec error]", data))
        cp.stdout.on('data', (data) => console.log("[exec]", data))
        */
        cp.on('close', (code) => console.log("[exec complete]", code));//process.exit(code))
 
    })
    
}