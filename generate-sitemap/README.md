# Lambda Warmup Project

## Install dependency

```shell
npm install serverless-mocha-plugin
npm install ../decompany-modules/decompany-common-utils/
npm install ../decompany-modules/decompany-app-properties/
npm install aws-sdk
npm install sitemap
```

## generate function

```shell
sls create function -f generateSitemap --handler src/generateSitemap.handler
```