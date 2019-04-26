# APIs

## Git clone & checkout
git clone https://github.com/decompanyio/decompanyio-back-end.git {branchName} --branch {branchName}
sprint-qa-03]$ git clone https://github.com/decompanyio/decompanyio-back-end.git sprint-qa-03 --branch sprint-qa-03

## install dependence

npm install --save-dev serverless-mocha-plugin
npm install ../decompany-modules/decompany-common-utils/
npm install mongojs
npm install aws-sdk
npm install web3
npm install rxjs
npm install ethereumjs-tx




## create api 

sls create function -f pageviewByHourly --handler functions/pageview/hourly.handler
sls create function -f pageviewRequestPutOnChainByDaily --handler functions/pageview/requestPutOnChainByDaily.handler
sls create function -f onchainWritePageview --handler functions/onchain/writePageview.handler
sls create function -f onchainWritePageviewTotalCount --handler functions/onchain/writePageviewTotalCount.handler
sls create function -f generateTopTag --handler functions/cron/generateTopTag.handler
sls create function -f voteRequestWriteOnchain --handler functions/cron/requestWriteVote.handler
sls create function -f readLatestVoteAmount --handler functions/onchain/readLatestVoteAmount.handler
sls create function -f readLatestCreatorReward --handler functions/onchain/readLatestCreatorReward.handler
sls create function -f hourlyReadVote --handler functions/cron/hourlyReadVote.handler
sls create function -f voteCollector --handler functions/cron/voteCollector.handler
sls create function -f pageviewCollector --handler functions/cron/pageviewCollector.handler
sls create function -f dailyPageviewWriteOnChain --handler functions/cron/dailyPageviewWriteOnChain.handler

# Test

sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount