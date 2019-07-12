# bounty-service


## USE

### Bounty 요청

GET /api/bounty/request

headers
  - Authorize : AUTH0 JWT
parameter
  - ethAccount : ethereum account
  - type : GAS or DECK

### Bounty 상태 확인

GET /api/bounty/state

headers
  - Authorize : AUTH0 JWT

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
npm install aws-sdk
```

## create api

```shell
sls create function -f bountyRequest --handler src/api/bountyRequest.handler --httpEvent "get /api/bounty/request"
sls create function -f bountyState --handler src/api/bountyState.handler --httpEvent "get /api/bounty/state"
sls create function -f auth --handler src/auth/auth.handler

```
