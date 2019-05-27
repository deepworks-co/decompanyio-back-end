# batch-email

## Git clone & checkout

```shell
git clone https://github.com/decompanyio/decompanyio-back-end.git {branchName} --branch {branchName}
```

example

```shell
git clone https://github.com/decompanyio/decompanyio-back-end.git sprint-qa-03 --branch sprint-qa-03
```

## install dependence

```shell
npm install --save-dev serverless-mocha-plugin
npm install ../decompany-modules/decompany-common-utils/
npm install ../decompany-modules/decompany-app-properties/
npm install aws-sdk
```

## create api

```shell
sls create function -f trackingConfirm --handler src/tracking/trackingConfirm.handler
```
