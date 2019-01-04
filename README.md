# decompanyio-back-end
Serverless Project

# Setup Dependencies
> npm install --save-dev serverless-mocha-plugin
> npm install --save-dev serverless-offline
> npm install web3
> npm install ethereumjs-tx

# Running Offline
> sls offline start

# Build using docker
cd {project_dir}
sudo node ../docker-npm.js rebuild

# Deploy
> sls deploy

# Test
> sls invoke test -f {FunctionName}
> sls invoke test -f registYesterdayViewCount

# Log
> sls logs -f {FunctionName}  -t
> sls logs -f registYesterdayViewCount  -t
