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

db["DEV-CA-CRONHIST-TOTALVIEWCOUNT"].find().forEach( function (x) {
  x._id = x.date
  db["DEV-CA-CRONHIST-TOTALVIEWCOUNT"].save(x);
});


db.DOCUMENT.update({}, {$unset: {confirmViewCountHist: 1}} , {multi: true});

### popular document list query

```javascript
db["DOCUMENT"].aggregate(
    [   
        {
            $match: {
                state: "CONVERT_COMPLETE"
            }
        }, {
            $lookup: {
                from: "PAGEVIEW-LATEST",
                foreignField: "_id",
                localField: "_id",
                as: "latestPageviewAs"
            }
        }, {
            $project: {title: 1, created: 1, latestPageview: { $arrayElemAt: [ "$latestPageviewAs", 0 ] }}
        }, {
            $project: {title: 1, created: 1, latestPageview: {$ifNull: ["$latestPageview.totalPageview", NumberInt(0)]}}
        }, {
            $out: "DOCUMENT-POPULAR"
        }
    ]
)
```

```javascript

db["DOCUMENT"].aggregate([
    {
        $match:{ state: "CONVERT_COMPLETE"}
    },
    { 
        $sort: { created: -1 }
    }, {
        $limit: 10
    }, {
        $skip: 10
    }, { 
        $lookup: { 
            from: 'DOCUMENT-POPULAR',
            localField: '_id',
            foreignField: '_id',
            as: 'documentAs' 
        } 
    }, { 
        $lookup: { 
            from: 'USER',
            localField: 'accoundId',
            foreignField: '_id',
            as: 'userAs' 
        } 
    }]
)
```

db["DOCUMENT"].aggregate([
    {
        $match:{ state: "CONVERT_COMPLETE"}
    },
    { 
        $sort: { created: -1 }
    }, {
        $skip: 10
    }, {
        $limit: 10
    } ]
)



```javascript

    
db["DOCUMENT-FEATURED"].aggregate(
    [{
        $sort:{ latestPageview:-1, created: -1}
    }, {
      $lookup: {
        from: "DOCUMENT",
        localField: "_id",
        foreignField: "_id",
        as: "documentAs"
      }
    }, {
      $lookup: {
        from: "DOCUMENT-POPULAR",
        localField: "_id",
        foreignField: "_id",
        as: "pageviewAs"
      }
    }, {
      $lookup: {
        from: "USER",
        localField: "accoundId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
        $addFields: {
            user: { $arrayElemAt: [ "$userAs", 0 ] },
            document: { $arrayElemAt: [ "$documentAs", 0 ] },
            pageview: { $arrayElemAt: [ "$pageviewAs", 0 ] }
        }
    }, {
        $addFields: {
            documentId: "$_id",
            latestPageview: "$pageview.latestPageview",
            userid: "$user._id",
            email: "$user.email",
            name: "$user.name",
            picture: "$user.picture",
        }
    }, {
        $project: {documentAs: 0, userAs: 0, pageviewAs: 0, document: 0, user: 0, pageview: 0}
    }]
).pretty()
```

## hourly latest pageview
```javascript
db["TRACKING"].aggregate(
    [{
    $match: {
      t: {$gte: 1552614531},
      n: {$gt: 1},
      id: "c4754f829e8f48d7a737e9e5ac592885"
    }
  }, {
    $group: {
      _id: {
        year: {$year: {$add: [new Date(0), "$t"]}}, 
        month: {$month: {$add: [new Date(0), "$t"]}}, 
        dayOfMonth: {$dayOfMonth: {$add: [new Date(0), "$t"]}},
        id: "$id",
        cid: "$cid",
        sid: "$sid"
      },
      timestamp: {$max: "$t"}
    }
  }, {
    $group: {
      _id: "$_id.id",
      totalPageview: {$sum: 1},
      timestamp: {$max: "$timestamp"}
    }
  }, {
    $addFields: {
      occurrenceDate: {$add: [new Date(0), "$timestamp"]}
    }
  }, {
    $project: {
      occurrenceDate: 1,
      totalPageview: 1,
    }
  }]
).pretty()
```


```javascript
db.VOTE.aggregate([{
        $match: {
            "applicant":"0xf319E1a032338183c4fDC024F3e3845497dB3152"
        }
    }, {
        $sort: {
            created: -1
        }
    }, {
        $group: {
            "_id": {documentId: "$documentId"},
            "deposit":{$sum:"$deposit"},
            "documentId": {$first:"$documentId"}
        }
    },
    {
        $lookup: {
            from: "DOCUMENT",
            localField: "documentId",
            foreignField:"documentId",
            as: "documentInfo"
        }
    }, {
        $unwind: {
            path:"$documentInfo",
            preserveNullAndEmptyArrays: true
        }
    }, {
        $match: {
            "documentInfo": {"$exists":true,"$ne":null}
        }
    }], {
        explain: true
    }
).pretty()
```