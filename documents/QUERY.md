# Query Example
```javascript
db["DEV-CA-DOCUMENT-VOTE"].update({},{$unset: {documentInfo:1}},{multi: true});
```

```javascript
db["DEV-CA-DOCUMENT-VOTE"].find({id:"worn29@gmail.com"}).sort({created: -1});
```

```javascript
db["DEV-CA-DOCUMENT-VOTE"].aggregate(
    [
        {
            $match: {
              id: "worn29@gmail.com"
            }
        },
        {
            $group:
            {
                _id: {documentId: "$documentId"},
                voteAmount: {$sum: "$voteAmount"},
                documentId : { $first: '$documentId' }
            }
        },
        {
            $lookup: {
                from: "DEV-CA-DOCUMENT",
                localField: "documentId",
                foreignField: "documentId",
                as: "documentInfo"
            }
      },
    ]
)
```

```javascript
db["DEV-CA-DOCUMENT-VOTE"].aggregate(
    [   
        {
            $match: {
                id: "worn29@gmail.com"
            }
        },     
        {
            $group:
            {
                _id: {documentId: "$documentId"},
                voteAmount: {$sum: "$voteAmount"},
                documentId : { $first: '$documentId' }
            }
        }
    ]
)
```

문서의 클라이언트, 세션별 트레킹 일반 정보
```javascript
db["DOCUMENT-TRACKING"].aggregate(
   [
    {
        $match: {
            id: "85ada3a953834b53afd06990490955b3"
        }
    },
    {
        $group: {
          _id: {year: {$year: {$add: [new Date(0), "$t"]}}, month: {$month: {$add: [new Date(0), "$t"]}}, dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}}, cid: "$cid",  sid: "$sid" },
          count: {$sum: 1},
          latest: {$min: "$t"},
          cid: {$first: "$cid"},
          sid: {$first: "$sid"},
          viewingPages: {$addToSet: "$n"}
        }
    },
    {
        $sort: {"latest": -1}
    }
    ]
).pretty()
```


문서 페이지별 트레킹 상세정보
```javascript
db["DOCUMENT-TRACKING"].aggregate(
   [
    {
        $match: {
            id: "6e1e0b4e86824eba81e9350a0fd1ff82"
        }
    },
    {
     $sort: {"t": 1}
    },
    {
        $group: {
          _id: {year: {$year: {$add: [new Date(0), "$t"]}}, month: {$month: {$add: [new Date(0), "$t"]}}, dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}}, cid: "$cid",  sid: "$sid" },
          cid : { $first: '$cid' },
          sid : { $first: '$sid' },
          latest: {$min: "$t"},
          resultList: { $addToSet: {t: "$t", n: "$n", e: "$e", ev:"$ev", cid: "$cid", sid: "$sid"} },
        }
    },
    {
     $sort: {"latest": -1}
    }
    ]
).pretty()
```

change field type string -> number
```javascript
db["DOCUMENT-TRACKING"].find({t: {$type:2}}).forEach( function (x) {
  x.t = new NumberLong(x.t); // convert field to string
  db["DOCUMENT-TRACKING"].save(x);
});

db["DOCUMENT-TRACKING"].find().forEach( function (x) {
  x.t = new NumberLong(x.t); // convert field to string
  x.n = new NumberInt(x.n); // convert field to string
  db["DOCUMENT-TRACKING"].save(x);
});
```