# graphql

## Test
[README](../restapis-wallet/README.md)

```
sls invoke test -s local --exit
sls invoke test -G CreatorSchemaTest -s local --exit
```

## create function

```bash
sls create function -f qraphql --handler src/qraphql/graphql --httpEvent "get /api/graphql"
```

