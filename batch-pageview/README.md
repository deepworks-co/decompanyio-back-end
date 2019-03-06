# APIs

## install serverless framework plugin

npm install --save-dev serverless-mocha-plugin

## Intall Dependences

npm install mongojs
npm install aws-sdk

## Install Ethereum lib Dependencies

npm install web3
npm install ethereumjs-tx

## Install Local Dependencies

npm install ../decompany-modules/decompany-common-utils/



## create api 

sls create function -f pageviewByHourly --handler functions/pageview/hourly.handler
sls create function -f pageviewRequestPutOnChainByDaily --handler functions/pageview/requestPutOnChainByDaily.handler
sls create function -f onchainWritePageview --handler functions/onchain/writePageview.handler
sls create function -f onchainWritePageviewTotalCount --handler functions/onchain/writePageviewTotalCount.handler

# Test

sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount