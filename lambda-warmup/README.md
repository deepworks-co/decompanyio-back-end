# Lambda Warmup Project

## Install dependency

```shell
npm install serverless-mocha-plugin
npm install ../decompany-modules/decompany-app-properties/
npm install aws-sdk
```

## generate function

sls create function -f warmup --handler src/warmup.handler