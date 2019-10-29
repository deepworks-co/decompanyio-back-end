# Batch-wallet

## Install Dependences

```bash
npm install --save-dev serverless-mocha-plugin
npm install --save-dev serverless-plugin-split-stacks
npm install --save-dev serverless-prune-plugin

```

```bash
npm install ../decompany-modules/decompany-app-properties
npm install ../decompany-modules/decompany-common-utils
```


## Create Function

```bash
sls create function -f eventDeck --handler src/event/deck.handler
sls create function -f sqsDeposit --handler src/sqs/deposit.handler
```

## CodeBuild

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Build started on `date`
  build:
    commands:
      - cd restapis-wallet
      - npm install ../decompany-modules/decompany-app-properties
      - npm install ../decompany-modules/decompany-common-utils
      - npm install ../decompany-modules/decompany-wallet
      - npm install
      - npm run deploy:dev
```