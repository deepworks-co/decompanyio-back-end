'use strict';
const exec = require('child_process').exec;
const path = require('path');

const t = Date.now();
const parentDir = path.parse(process.cwd()).dir;
const projectname = path.parse(process.cwd()).name;
getRevision().then((rev)=>{
    const tagName = `${projectname}-v${t}-${rev}`;
    console.log("tagName", tagName);
    return Promise.resolve(tagName)
})
.then((tagName)=>{
    return createTag(tagName)
})
.then((res)=>{
    console.log(res);
})
.catch((err)=>{
    console.log(err);
});


async function createTag(tagName){

    return await promiseExec(`git tag ${tagName} && git push origin ${tagName}`).then(({stdout})=>{
        return Promise.resolve(stdout);
    });
    
}

async function getRevision() {
    const revision = await promiseExec('git rev-parse HEAD').then(({stdout})=>{
        const revision = stdout.split('\n')[0];
        return revision.substring(0, 7);
    });
    

    return revision
}

function promiseExec(cmd){
    return new Promise((resolve, reject) => (
        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
              console.log(stdout);
            resolve({stdout, stderr});
          }
        })
      ))
} 