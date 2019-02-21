# APIs

# install serverless framework plugin

npm install --save-dev serverless-mocha-plugin

## Dependences

npm install mongojs
npm install aws-sdk

# Install Local Dependencies

npm install ../decompany-modules/decompany-common-utils/



## create api 

sls create function -f pageviewByHourly --handler functions/pageview/hourly.handler

sls create function -f pageviewRequestPutOnChainByDaily --handler functions/pageview/requestPutOnChainByDaily.handler