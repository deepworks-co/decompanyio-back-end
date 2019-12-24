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
  "enode://40cff7f3ba30a98ebc8a8a62c5f34b7884202599644c013cbc3c1d53560b88563e63696918de34a00396f413203b11e8cdf2d04f717c406a4eacdb31d79542ca@10.1.12.109:30303",
  "enode://21ddb8d579417c3f6b21438c7fda64d5e3e1be9b92d3e0a11222a97884bbf4e0bbe7cfa182e02ab195fc06e7c85653dfb5d5d5955caefa9e16da38878d8122f2@10.1.11.96:30303",
  "enode://013ffffb21e21c048ad414e2d868dfe83235fce6bf9ecdb9309064f530e34fc0de4979f8b919c530a678698ab5e427b1d33ace9bfcb344949b56c4efd94ccc59@10.1.12.228:30303"
]
```

## Add Peer
```bash
#Geth 1
admin.addPeer("enode://40cff7f3ba30a98ebc8a8a62c5f34b7884202599644c013cbc3c1d53560b88563e63696918de34a00396f413203b11e8cdf2d04f717c406a4eacdb31d79542ca@10.1.12.109:30303")
#Geth 2
admin.addPeer("enode://21ddb8d579417c3f6b21438c7fda64d5e3e1be9b92d3e0a11222a97884bbf4e0bbe7cfa182e02ab195fc06e7c85653dfb5d5d5955caefa9e16da38878d8122f2@10.1.11.96:30303")
#Miner 1
admin.addPeer("enode://013ffffb21e21c048ad414e2d868dfe83235fce6bf9ecdb9309064f530e34fc0de4979f8b919c530a678698ab5e427b1d33ace9bfcb344949b56c4efd94ccc59@10.1.12.228:30303")
#Miner 2
admin.addPeer("enode://cbfc98f2b4ed5cef540437a5e0870d0ed61c4e29b6395a9d1e337661706b4b5399a7a03d9109b5bcb7d7bfb495a7848b172f1642b2811587a504ab9d1d30d5bc@10.1.11.242:30303")
```


## Health Check
```bash
curl -X POST https://geth.polarishare.com \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
--data-binary '{"jsonrpc":"2.0","id":999,"method":"eth_blockNumber"}'
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

