# View를 이용하여 balnace 조회하기 VW-WALLET-BALANCE 생성하기

## Create View
```javascript

db.createView("VW-WALLET-BALANCE", "WALLET", [
    {
        "$group": {
            _id: "$account",
            balance: {
            $sum: {$multiply: ["$value", "$factor"]}
            }
        }
    }
])

```

## Update View
```javascript
db.getCollection("VW-WALLET-BALANCE").drop();

db.WALLET.aggregate([
    {
        "$group": {
            "_id": "$address",
            "balance": {
                "$sum": {$multiply: ["$value", "$factor"]}
            }
        }
    }
]).saveAsView("VW-WALLET-BALANCE");
```

## 확인
```javascript
let total=0
db.WALLET.find({account: "0xa05b51311397C5552798Ce216250BC0e757c1Aa2"}).forEach((it)=>{
    total += (it.value.toString() * it.factor.toString());
    console.log(it.value.toString(), it.factor, total);
})
```