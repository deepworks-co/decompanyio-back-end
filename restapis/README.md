# decompanyio-back-end
Serverless Project

# install serverless framework plugin
npm install --save-dev serverless-mocha-plugin
npm install --save-dev serverless-offline
npm install serverless-plugin-existing-s3

# Setup Dependencies
npm install web3
npm install ethereumjs-tx

#https://github.com/mafintosh/mongojs
npm install mongojs

# Running Offline
sls offline start

# Build using docker
cd {project_dir}
sudo node ../docker-npm.js rebuild

# Deploy
sls deploy

# show deploy function list
sls deploy list

# Test
sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount

# Log
sls logs -f {FunctionName}  -t
sls logs -f registYesterdayViewCount  -t

# serverless-mocha-plugin
# create function example
sls create function -f accountSync --handler controllers/account/sync.handler --httpEvent "get /api/account/sync"
sls create function -f accountUpdate --handler controllers/account/update.handler --httpEvent "post /api/account/update"
sls create function -f accountGet --handler controllers/account/get.handler --httpEvent "post /api/account/get"
sls create function -f accountPicture --handler controllers/account/picture.handler --httpEvent "post /api/account/picture"

sls create function -f s3DocumentUploadComplete --handler s3/document/create.handler
sls create function -f s3DocumentConvertComplete --handler s3/document/create.handler
sls create function -f s3DocumentMetaInfo --handler s3/document/create.handler


#API GATEWAY Custom Access Log Format
{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "caller":"$context.identity.caller", "user":"$context.identity.user","userAgent":"$context.identity.userAgent", "requestTime":"$context.requestTime", "requestTimeEpoch":"$context.requestTimeEpoch", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "path":"$context.path", "responseLatency":"$context.responseLatency", "status":"$context.status","protocol":"$context.protocol", "responseLength":"$context.responseLength" }