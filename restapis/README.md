# decompanyio-back-end

Serverless Project

# install serverless framework plugin

npm install --save-dev serverless-mocha-plugin
npm install --save-dev serverless-offline
npm install serverless-plugin-existing-s3
npm install serverless-aws-documentation --save-dev

# Install Ethereum lib Dependencies

npm install web3
npm install ethereumjs-tx

# Install Local Dependencies

npm install ../decompany-modules/decompany-common-utils/

# https://github.com/mafintosh/mongojs

npm install mongojs

# Running Offline

sls offline start

# Build using docker

cd {project_dir}
sudo node ../docker-npm.js rebuild

# Deploy

sls deploy

# Deploy by function

serverless deploy function -f trackingCollect

# show deploy function list

sls deploy list

# Test

sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount

# Log
sls logs -f {FunctionName}  -t
sls logs -f registYesterdayViewCount  -t

# serverless-mocha-plugin

## create function example

sls create function -f accountSync --handler controllers/account/sync.handler --httpEvent "get /api/account/sync"
sls create function -f accountUpdate --handler controllers/account/update.handler --httpEvent "post /api/account/update"
sls create function -f accountGet --handler controllers/account/get.handler --httpEvent "post /api/account/get"
sls create function -f accountPicture --handler controllers/account/picture.handler --httpEvent "post /api/account/picture"

sls create function -f s3DocumentUploadComplete --handler s3/document/create.handler
sls create function -f s3DocumentConvertComplete --handler s3/document/create.handler
sls create function -f s3DocumentMetaInfo --handler s3/document/create.handler



sls create function -f tagList --handler controllers/tag/list.handler --httpEvent "get /api/tags"