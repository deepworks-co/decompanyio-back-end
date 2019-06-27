# verify-email

## Git clone & checkout

```shell
git clone https://github.com/decompanyio/decompanyio-back-end.git {branchName} --branch {branchName}
```

example

```shell
git clone https://github.com/decompanyio/decompanyio-back-end.git sprint-prepare-release --branch sprint-prepare-release
```

## install dependence

```shell
npm install serverless-mocha-plugin
npm install serverless-aws-documentation
npm install ../decompany-modules/decompany-common-utils/
npm install ../decompany-modules/decompany-app-properties/
npm install nodemailer
npm install aws-sdk
```

## create api

```shell
sls create function -f trackingConfirmSender --handler src/tracking/trackingConfirmSender.handler
sls create function -f verifyEmailSender --handler src/email/verifyEmailSender.handler
sls create function -f adminEmailBatchSender --handler src/email/adminEmailBatchSender.handler

sls create function -f sendBatchEmail --handler src/batch/sendBatchEmail.handler
```
