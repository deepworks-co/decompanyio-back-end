'use strict'

// ideal for use with AWS Lambda and native Node.js modules

// requires Docker: https://docs.docker.com/engine/installation/

/*
Usage:
  node docker-npm.js install
  node docker-npm.js rebuild
*/
const childProcess = require('child_process')
const path = require('path');
const nodejsImage = 'node:8.10'
const innerWorkingDir = '/src'
const parentDir = path.parse(process.cwd()).dir;
const projectname = path.parse(process.cwd()).name;
const commonmodulesname = 'decompany-modules';
const dockerArgs = [
  'run', '-i',
  '-v', `${parentDir}/${projectname}:${innerWorkingDir}/${projectname}`,
  '-v', `${parentDir}/${commonmodulesname}:${innerWorkingDir}/${commonmodulesname}`,
  '-w', `${innerWorkingDir}/${projectname}`,
  nodejsImage, 'npm'
]

console.log({parentDir, projectname, commonmodulesname});
const npmArgs = process.argv.slice(2)

const cp = childProcess.execFile(
  'docker',
  dockerArgs.concat(npmArgs),
  {},
  (err, stdout, stderr) => {}
)

cp.stderr.on('data', (data) => console.error(data))
cp.stdout.on('data', (data) => console.log(data))

cp.on('close', (code) => process.exit(code))