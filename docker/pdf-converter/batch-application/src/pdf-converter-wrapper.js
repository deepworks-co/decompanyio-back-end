'use strict';
const childProcess = require('child_process')

module.exports = async (event, cb) => {
    
    const result = await execEngine(event.payload);
    const response = {
        success: result.stderr?false:true,
        payload: event.payload,
        jobId: event.jobId,
        result: result
    }
    if(cb) cb(response);
    
    return response;
}


function execEngine(payload){

    return new Promise((resolve, reject)=>{
        const rand = Date.now();
        const temp =  "./temp_" + rand;
        //console.log(temp);
        let options = ["-jar", "PolarisConverter8.jar", "PDF"].concat(payload).concat([temp]);
            
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