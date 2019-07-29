'use strict';
const exec = require('child_process').exec;

module.exports.toDateString = async (serverless) => {
  const now = new Date();
  const s = now.toJSON();
  console.log("Build Datetime", s);
  return s;
}

module.exports.s3Config = async (serverless) => {
    const stage = serverless.processedInput.options.stage;
    if(stage){
        process.env.stage = stage;
    }    
    const { s3Config } = require('decompany-app-properties');    

    //console.log('s3Config', JSON.stringify(s3Config));

    if(!s3Config){
      throw new Error(`s3Config is null ${stage}`);
    }

    return s3Config;
}
module.exports.project = async (serverless) => {
    const split = process.cwd().split("/");
    const project = split[split.length-1];
    console.log("project", project);
    return project;
}
module.exports.git_revision = async (serverless) => {
    const revision = await promiseExec('git rev-parse HEAD').then(({stdout})=>{
        const revision = stdout.split('\n')[0];
        console.log("current revision", revision);
        return revision;
    });
    

    return revision
}

module.exports.git_branch = async (serverless) => {

    const branch = await promiseExec('git rev-parse --abbrev-ref HEAD').then(({stdout}) => {
        const currentBranch = stdout.split('\n')[0];
        console.log("current branch", currentBranch);
        return currentBranch;
    });

    return branch
}

const promiseExec = cmd => (
    new Promise((resolve, reject) => (
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({stdout, stderr});
        }
      })
    ))
  );

module.exports.getGeoipLayer = (serverless)=>{
  const stage = serverless.processedInput.options.stage;
  if(stage){
      process.env.stage = stage;
  }    
  const { layer } = require('decompany-app-properties');    
  console.log("load layer", layer.geoip);
  return layer.geoip;
}


module.exports.getSharpLayer = (serverless)=>{
  const stage = serverless.processedInput.options.stage;
  if(stage){
      process.env.stage = stage;
  }    
  const { layer } = require('decompany-app-properties');    
  console.log("load layer", layer.sharp);
  return layer.sharp;
}