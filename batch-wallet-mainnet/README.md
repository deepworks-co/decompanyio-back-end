# Batch-wallet

## Install Dependences

```bash
npm install ../decompany-modules/decompany-app-properties
npm install ../decompany-modules/decompany-common-utils

npm i  --save-dev serverless-mocha-plugin
npm i  --save-dev serverless-plugin-split-stacks
npm i  --save-dev serverless-prune-plugin
```

## Create Function

```bash
sls create function -f eventDeposit --handler src/event/deck.handler
sls create function -f eventWithdraw --handler src/event/withdraw.handler
```

