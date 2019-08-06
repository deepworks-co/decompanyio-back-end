'use strict';
const childProcess = require('child_process')
const path = require('path');

module.exports = (event) => {

    return new Promise((resolve, reject)=>{
        const {downloadPath, outputPath, w, h} = event.payload;
        const tempPath = `${path.join(downloadPath, "..")}/temp`;
        const args = [downloadPath, outputPath, w, h, tempPath];
        execEngine(args)
        .then((result)=>{
            const response = {
                success: result.stderr?false:true,
                payload: event.payload,
                jobId: event.jobId,
                result: result,
                downloadPath,
                outputPath
            }
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