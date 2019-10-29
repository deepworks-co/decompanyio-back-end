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

## 개발 geth 실행하기
``` bash
nohup geth --networkid 931 \
      --etherbase "0xa5909482f9f32219de9b23ceb0c4ee26609bcf94" \
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
personal.unlockAccount(eth.coinbase, "******")
personal.unlockAccount("0x55735115f06986e6fa2561976ebf55d29eec4212", "******")
eth.sendTransaction({from:"0x55735115f06986e6fa2561976ebf55d29eec4212", to:"0x0d720e25e424ca6e4a7dcccddae136db2bc44639", value: web3.toWei(100, "ether")})
eth.sendTransaction({from:eth.accounts[0], to:"0x4Ee128892469e7962e6E617727cb99C59525D7D2", value: web3.toWei(100, "ether")}) //for jay
eth.sendTransaction({from:eth.accounts[0], to:"0x4add6551af429c71eB64e0494BC5E88334E94948", value: web3.toWei(100, "ether")}) //for chris
```

```base
personal.unlockAccount(eth.accounts[0], "******")
eth.sendTransaction({from:eth.accounts[0], to:"0x07Ab267B6F70940f66EAf519b4a7c050496480D3", value: web3.toWei(100, "ether")}) //for jay
```



## static-nodes.json
```json
[
  "enode://8a19ed7a56c9e13b9a0233d870a95b0c5abf6fbbb02aace0c94fbc61160b9d1f1677e6ac54dc5fb2255646d8abb26d0e8f870bbaa0f69cfe1fd15794c82001fd@10.1.12.109:30303",
  "enode://6dcf9664b66ed2815304777a2e4d0c008ef9d71dca3deb6188eff6ea495d39b1782887ca20da248eb3fc3a6442f616cb3e55c7078d4e802eb53e88464791ce20@10.1.11.96:30303",
  "enode://2a4ac0c9305af649fa9a49cd5f3caa8e1c67ca6d639dc3eed58a99977e8ca3cadcd59c89b6eedb4614c0ae57f869a2344581646e4f2252a7a194ef07dc9c2a3b@10.1.12.228:30303",
  "enode://10d573c084cbc87d81f813985b3228531b015e1474ba9f1346eb6c74c9fa00b7c7964df45f898e28940ecbbfb8708f24ba921f0a0675a1f452e61511059ed336@10.1.11.242:30303"
]
```

## Add Peer
```bash
#Geth 1
admin.addPeer("enode://8a19ed7a56c9e13b9a0233d870a95b0c5abf6fbbb02aace0c94fbc61160b9d1f1677e6ac54dc5fb2255646d8abb26d0e8f870bbaa0f69cfe1fd15794c82001fd@10.1.12.109:30303")
#Geth 2
admin.addPeer("enode://6dcf9664b66ed2815304777a2e4d0c008ef9d71dca3deb6188eff6ea495d39b1782887ca20da248eb3fc3a6442f616cb3e55c7078d4e802eb53e88464791ce20@10.1.11.96:30303")
#Miner 1
admin.addPeer("enode://2a4ac0c9305af649fa9a49cd5f3caa8e1c67ca6d639dc3eed58a99977e8ca3cadcd59c89b6eedb4614c0ae57f869a2344581646e4f2252a7a194ef07dc9c2a3b@10.1.12.228:30303")
#Miner 2
admin.addPeer("enode://7bf33d56becbcb6f479d73b2497bb2b2f6597dbee9bdc04bdd481c6b1fa87d2c698684eb12bc0354da98130407c6c12674433051e34d4208f0dcc36d3450866c@10.1.11.242:30303")
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