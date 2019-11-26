# View를 이용하여 balnace 조회하기 VW-WALLET-BALANCE 생성하기

## Create View
```javascript

db.createView("VW-WALLET-BALANCE", "WALLET", [
    {
        "$group": {
            _id: "$account",
            balance: {
            $sum: "$value"
            }
        }
    }
])

```