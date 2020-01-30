```javascript

db.getCollection("VW-DAILY-PAGEVIEW").drop();

db.getCollection("STAT-PAGEVIEW-DAILY").aggregate([
    {
        "$lookup": {
            "from": "STAT-PAGEVIEW-TOTALCOUNT-DAILY",
            "localField": "blockchainTimestamp",
            "foreignField": "blockchainTimestamp",
            "as": "totalPageviewInfo"
        }
    },
    {
        "$lookup": {
            "from": "DOCUMENT",
            "localField": "documentId",
            "foreignField": "_id",
            "as": "docInfo"
        }
    },
    {
        "$unwind": {
            "path": "$totalPageviewInfo",
            "preserveNullAndEmptyArrays": true
        }
    },
    {
        "$unwind": {
            "path": "$docInfo",
            "preserveNullAndEmptyArrays": false
        }
    },
    {
        "$addFields": {
            "userId": "$docInfo.accountId",
            "totalPageview": "$totalPageviewInfo.totalPageview",
            "totalPageviewSquare": "$totalPageviewInfo.totalPageviewSquare"
        }
    },
    {
        "$project": {
            "totalPageviewInfo": 0,
            "transactionHash": 0,
            "year": 0,
            "month": 0,
            "dayOfMonth": 0,
            "totalPageviewLastIndex": 0,
            "docInfo": 0
        }
    }
]).saveAsView("VW-DAILY-PAGEVIEW");
```