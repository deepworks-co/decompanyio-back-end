# batch-pageview

## Git clone & checkout

```shell
git clone https://github.com/decompanyio/decompanyio-back-end.git {branchName} --branch {branchName}
sprint-qa-03]$ git clone https://github.com/decompanyio/decompanyio-back-end.git sprint-qa-03 --branch sprint-qa-03
```

## install dependence

```shell
npm install --save-dev serverless-mocha-plugin
npm install ../decompany-modules/decompany-common-utils/
npm install ../decompany-modules/decompany-app-properties/
npm install mongojs
npm install aws-sdk
npm install web3
npm install rxjs
npm install ethereumjs-tx
```


## Step Function 생성

```javascript
{
  "StartAt": "DailyAggregatePageview",
  "TimeoutSeconds": 60,
  "States": {
    "DailyAggregatePageview": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-west-1:197966029048:function:batch-pageview-dev-dailyPageview:$LATEST",
      "Next": "IsExistsAggregatePageview",
      "InputPath": "$",
      "ResultPath": "$"
    },
    "IsExistsAggregatePageview": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.remains",
          "NumericGreaterThan": 0,
          "Next": "WriteOnchain"
        }
      ],
      "Default": "Success"
    },
    "WriteOnchain": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-west-1:197966029048:function:batch-pageview-dev-pageviewWriteOnchain:$LATEST",
      "Next": "IsLeftDocumentsWrittenOnchain",
      "InputPath": "$",
      "ResultPath": "$"
    },
    "IsLeftDocumentsWrittenOnchain": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.remains",
          "NumericGreaterThan": 0,
          "Next": "WriteOnchain"
        }
      ],
      "Default": "Success"
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

## create api

```bash
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
sls create function -f registryCollector --handler functions/cron/registryCollector.handler
sls create function -f blockCollector --handler functions/cron/blockCollector.handler
sls create function -f recentlyPageview --handler functions/cron/recentlyPageview.handler


sls create function -f pageviewWriteOnChainTrigger --handler functions/onchain/pageviewWriteOnChainTrigger.handler
```

## Test

sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount
