```javascript
db.getCollection("VW-DAILY-VOTE").drop();

db.VOTE.aggregate([
    {
        "$group": {
            "_id": {
                "blockchainTimestamp": "$blockchainTimestamp",
                "userId": "$userId",
                "documentId": "$documentId"
            },
            "userId": {
                "$last": "$userId"
            },
            "documentId": {
                "$last": "$documentId"
            },
            "blockchainTimestamp": {
                "$last": "$blockchainTimestamp"
            },
            "totalDeposit": {
                "$sum": "$deposit"
            }
        }
    },
    {
        "$lookup": {
            "from": "STAT-PAGEVIEW-DAILY",
            "let": {
                "documentId": "$documentId",
                "blockchainTimestamp": "$blockchainTimestamp"
            },
            "pipeline": [
                {
                    "$match": {
                        "$expr": {
                            "$and": [
                                {
                                    "$eq": [
                                        "$documentId",
                                        "$$documentId"
                                    ]
                                },
                                {
                                    "$eq": [
                                        "$blockchainTimestamp",
                                        "$$blockchainTimestamp"
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "blockchainDate": 0,
                        "blockchainTimestamp": 0,
                        "created": 0,
                        "documentId": 0
                    }
                }
            ],
            "as": "pageviewInfo"
        }
    },
    {
        "$lookup": {
            "from": "STAT-PAGEVIEW-TOTALCOUNT-DAILY",
            "localField": "blockchainTimestamp",
            "foreignField": "blockchainTimestamp",
            "as": "totalcountInfo"
        }
    },
    {
        "$unwind": {
            "path": "$pageviewInfo",
            "preserveNullAndEmptyArrays": true
        }
    },
    {
        "$unwind": {
            "path": "$totalcountInfo",
            "preserveNullAndEmptyArrays": true
        }
    },
    {
        "$addFields": {
            "pageview": "$pageviewInfo.pageview",
            "totalPageview": "$totalcountInfo.totalPageview",
            "totalPageviewSquare": "$totalcountInfo.totalPageviewSquare"
        }
    },
    {
        "$project": {
            "pageviewInfo": 0,
            "totalcountInfo": 0
        }
    }
]).saveAsView("VW-DAILY-VOTE");
```