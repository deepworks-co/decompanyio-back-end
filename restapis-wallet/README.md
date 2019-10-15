# restapis-wallet 환경 구성

## EOA Private Key정보를 암호화 하기 위한 KMS 키 생성

```bash
aws kms create-key \
--description asem-ko-owa-enc-key \
--region ap-northeast-2 \
--origin AWS_KMS \
--tags TagKey=stage,TagValue=asem
```



create alias
주의 --alias-name 옵션의 경우 prefix인 alias/는 실제 명에서 제외됨 그러나 설정시 있어야함
>https://docs.aws.amazon.com/cli/latest/reference/kms/create-alias.html
>Specifies the alias name. This value must begin with alias/ followed by a name, such as alias/ExampleAlias . The alias name cannot begin with alias/aws/ . The alias/aws/ prefix is reserved for AWS managed CMKs.

```bash
aws kms create-alias \
--alias-name alias/asem-ko-owa-enc-key \
--target-key-id arn:aws:kms:ap-northeast-2:197966029048:key/eaee13d5-9618-46c0-b777-8d6d3a58a0c8 \
--region ap-northeast-2
```

ethereum npm

```bash
npm install web3
npm install rxjs
npm install ethereumjs-tx
```

## create function

```bash
sls create function -f createAccount --handler src/account/create.handler --httpEvent "post /api/account/create"
sls create function -f transferDeck --handler src/deck/transfer.handler --httpEvent "post /api/deck/transfer"
sls create function -f requestGas --handler src/gas/request.handler --httpEvent "post /api/gas/request"
sls create function -f getBalance --handler src/account/balance.handler --httpEvent "get /account/balance"
```