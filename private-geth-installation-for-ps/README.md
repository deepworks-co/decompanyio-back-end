# Private Node 구축하기

## Genesis Block Init
모든 노드에서 genesis노드를 생성한다.
```bash
geth init genesis.json
```

## Running
  기본
  ```bash
  geth --networkid 931 --rpc
  ```

  ### Background Running
  기본
  ```bash
  nohup geth --networkid 931 --rpc &
  nohup geth --networkid 931 --rpc --rpcaddr "0.0.0.0" &
  ```

  ### geth를 rpc, ws, graphql과 함께 구동하기
  ```bash
  nohup geth \
  --networkid 931 \
  --rpc \
  --rpcaddr "0.0.0.0" \
  --rpcvhosts "*" \
  --rpccorsdomain "*" \
  --ws \
  --wsaddr "0.0.0.0" \
  --wsorigins "*" \
  --graphql \
  --graphql.addr "0.0.0.0" \
  --graphql.corsdomain "*" \
  --graphql.vhosts "*" \
  2>> eth.log &
  ```

## Running Geth node with bootnodes

```bash
nohup geth --networkid 931 \
      --rpc --rpcaddr "0.0.0.0" \
      --rpccorsdomain "*" \
      --rpcapi "admin,db,eth,net,web3,miner,personal" \
      --bootnodes "enode://5e06fffd153f2aea8f0b311a4c4e8c00c8662182cd5ee39aae6a84348005c650f7d83a7f377d33acb21fdf7ff8725fa5670f64c355ea6f437cf83b6a36f375a1@172.31.37.170:30303" &

nohup geth --networkid 931 \
      --rpc \
      --rpcaddr "0.0.0.0" \
      --bootnodes "enode://5e06fffd153f2aea8f0b311a4c4e8c00c8662182cd5ee39aae6a84348005c650f7d83a7f377d33acb21fdf7ff8725fa5670f64c355ea6f437cf83b6a36f375a1@172.31.37.170:30303"
```

## Miner 설정
1) ALPHA-CA-DOCKER-MINER 에서 

```javascript
personal.newAccount()
Password:
Repeat password: 
```
"0x55735115f06986e6fa2561976ebf55d29eec4212"

2) Miner 구동

```bash
nohup geth --networkid 931 \
      --rpc --rpcaddr "0.0.0.0" \
      --rpccorsdomain "*" \
      --bootnodes "enode://5e06fffd153f2aea8f0b311a4c4e8c00c8662182cd5ee39aae6a84348005c650f7d83a7f377d33acb21fdf7ff8725fa5670f64c355ea6f437cf83b6a36f375a1@172.31.37.170:30303" \
      --rpcapi "admin,db,eth,net,web3,miner,personal" \
      --etherbase "0x55735115f06986e6fa2561976ebf55d29eec4212" \
      --mine --minerthreads=1 &
```
```bash
nohup geth --networkid 931 \
      --etherbase "0x55735115f06986e6fa2561976ebf55d29eec4212" \
      --ethstats "miner:Polarishare@10.1.11.45:3000" \
      --mine --minerthreads=1 &
```
## Option 설명

### RPC Option 설명
>   --rpc : rpc 를 사용함
>   --rpcaddr : RPC 를 Listen 하는 IP Address Bining (기본: 127.0.0.1)
>   --rpcport : RPC Listen Port (기본:8545)
>   --rpcapi : RPC 를 통해 사용 가능한 API 셋 (기본: db, eth, net, web3) (이외에 admin, debug, miner, shh, txpool, personal 을 , 로 구분하여 추가 가능)
>   --rpccorsdomain : Browser 에서 web3.js 사용 시 Cross Domain 문제가 생기지 않도록 Accept 할 Document 의 Origin Domain.

## Running && Javascript Console

```bash
geth --networkid 931 console
```


## RPC Attach Geth 

```bash
geth attach rpc:http://localhost:8545
```

## IPC Attach Geth

```bash
geth attach
geth attach ipc:~/.ethereum/geth.ipc
```


## Transcation Test (Send Ether)

```bash
personal.unlockAccount("0x55735115f06986e6fa2561976ebf55d29eec4212", "infra1122!")
eth.sendTransaction({from:"0x55735115f06986e6fa2561976ebf55d29eec4212", to:"0x0d720e25e424ca6e4a7dcccddae136db2bc44639", value: web3.toWei(100, "ether")})
eth.sendTransaction({from:"0x55735115f06986e6fa2561976ebf55d29eec4212", to:"0x4Ee128892469e7962e6E617727cb99C59525D7D2", value: web3.toWei(100, "ether")}) //for jay
eth.sendTransaction({from:"0x55735115f06986e6fa2561976ebf55d29eec4212", to:"0x4add6551af429c71eB64e0494BC5E88334E94948", value: web3.toWei(1000, "ether")}) //for chris

```



## static-nodes.json
```json
[
  "enode://88ff2e9837df46b48ee793adbb61e7cf4e3d0c116e35f7e5c24d7b3030e3b28a6c7f5a624934ac118ae378c9fe66ecf50c7a8d7866075fb866ac6a48c55d2cb2@10.1.11.12:30303",
  "enode://5e06fffd153f2aea8f0b311a4c4e8c00c8662182cd5ee39aae6a84348005c650f7d83a7f377d33acb21fdf7ff8725fa5670f64c355ea6f437cf83b6a36f375a1@10.1.12.109:30303",
  "enode://1df2fb4cf9295d7d0c807edc96a5a13c993ee5ea61ece3092b49a57422e081ebfe2821a01dc2963f4c378ab367e1043696ba8018488f274e6c45dfc2d2140e76@10.1.11.96:30303",
  "enode://66e281791d998642c0c62f65f14aab3ce02668c1e8ea74ad3413ceec91f831da4c840185d3c72949cd5a0a70170e613a6633a10c63dc6290ee368d547fa3a13f@10.1.12.128:30303"
]
```

```bash
admin.addPeer("enode://5e06fffd153f2aea8f0b311a4c4e8c00c8662182cd5ee39aae6a84348005c650f7d83a7f377d33acb21fdf7ff8725fa5670f64c355ea6f437cf83b6a36f375a1@10.1.12.109:30303")
admin.addPeer("enode://1df2fb4cf9295d7d0c807edc96a5a13c993ee5ea61ece3092b49a57422e081ebfe2821a01dc2963f4c378ab367e1043696ba8018488f274e6c45dfc2d2140e76@10.1.11.96:30303")
```

```bash
admin.addPeer("enode://88ff2e9837df46b48ee793adbb61e7cf4e3d0c116e35f7e5c24d7b3030e3b28a6c7f5a624934ac118ae378c9fe66ecf50c7a8d7866075fb866ac6a48c55d2cb2@10.1.12.228:30303")
admin.addPeer("enode://66e281791d998642c0c62f65f14aab3ce02668c1e8ea74ad3413ceec91f831da4c840185d3c72949cd5a0a70170e613a6633a10c63dc6290ee368d547fa3a13f@10.1.11.242:30303")
```

## Health Check
```bash
curl --head http://ec2-52-8-27-221.us-west-1.compute.amazonaws.com:8547

curl -X POST http://ec2-52-8-27-221.us-west-1.compute.amazonaws.com:8545 --data-binary "{"jsonrpc":"2.0","id":999,"method":"eth_blockNumber"}"
```

## Target Group Health Check 조회

alpha-ca-geth-rpc
```bash
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-west-1:197966029048:targetgroup/alpha-ca-geth-rpc/62db44e4312b3893
```

alpha-ca-geth-graphql
```bash
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-west-1:197966029048:targetgroup/alpha-ca-geth-graphql/1e54de1be02d7cd7
```