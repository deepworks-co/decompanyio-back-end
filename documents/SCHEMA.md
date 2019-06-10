# SCHEMA

## USER Collection

```javascript
db.createCollection("USER");
db.USER.createIndex({email: 1})
db.USER.createIndex({username: 1})
db.USER.createIndex({sub: 1}, {unique:true})
```

## DOCUMENT COLLECTION

```javascript
db.createCollection("DOCUMENT");
db.DOCUMENT.createIndex({documentId: 1}, {unique: true})
db.DOCUMENT.createIndex({seoTitle: 1}, {unique: true});
db.DOCUMENT.createIndex({state: 1, tags: 1, accountId: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, tags: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, accountId: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, created: -1})
```

## DOCUMENT-POPULAR

```javascript
db.createCollection("DOCUMENT-POPULAR");
db["DOCUMENT-POPULAR"].createIndex( { latestPageview: -1, created: -1 })
db["DOCUMENT-POPULAR"].createIndex( { tags: 1, accountId: 1, latestPageview: -1, created: -1 })
db["DOCUMENT-POPULAR"].createIndex( { tags: 1, latestPageview: -1, created: -1 })
db["DOCUMENT-POPULAR"].createIndex( { accountId: 1, latestPageview: -1, created: -1 })
```

## DOCUMENT-FEATURED

```javascript
db.createCollection("DOCUMENT-FEATURED");
db["DOCUMENT-FEATURED"].createIndex( { latestVoteAmount: -1, created: -1 })
db["DOCUMENT-FEATURED"].createIndex( { tags: 1, accountId: 1, latestVoteAmount: -1, created: -1 })
db["DOCUMENT-FEATURED"].createIndex( { tags: 1, latestVoteAmount: -1, created: -1 })
db["DOCUMENT-FEATURED"].createIndex( { accountId: 1, latestVoteAmount: -1, created: -1 })
```

## SEO-FRIENDLY

```javascript
db.createCollection("SEO-FRIENDLY")
db["SEO-FRIENDLY"].createIndex({{created: -1}})
```


## TRACKING

```javascript
db.createCollection("TRACKING");
db["TRACKING"].createIndex({id: 1, cid: 1, sid: 1, created: -1})
db["TRACKING"].createIndex({id: 1, cid: 1, sid: 1, t: 1})
```

## TRACKING-USER

```javascript
db.createCollection("TRACKING-USER");
db["TRACKING-USER"].createIndex({id: 1})
db["TRACKING-USER"].createIndex({cid: 1})
db["TRACKING-USER"].createIndex({e: 1})
db["TRACKING-USER"].createIndex({id: 1, cid: 1})
```

## TOP-TAG

```javascript
db.createCollection("TOP-TAG");
db["TOP-TAG"].createIndex({value: -1})
```

## TOP-TAG-POPULAR

```javascript
db.createCollection("TOP-TAG-POPULAR");
db["TOP-TAG-POPULAR"].createIndex({value: -1})
```

## TOP-TAG-FEATURED

```javascript
db.createCollection("TTOP-TAG-FEATURED");
db["TOP-TAG-FEATURED"].createIndex({value: -1})
```

## PAGEVIEW-LATEST

```javascript
db.createCollection("PAGEVIEW-LATEST");
db["PAGEVIEW-LATEST"].createIndex( { "expireAt": 1 }, { expireAfterSeconds: 0 } )
```

## VOTE

```javascript
db.createCollection("VOTE");
db["VOTE"].createIndex( { documentId: 1, created: -1 } )
db["VOTE"].createIndex( { applicant: 1, created: -1 } )
db["VOTE"].createIndex( { applicant: 1,documentId: 1,created: -1 } )
db["VOTE"].createIndex( { blockNumber: -1 } )
```

## query collection's index

```javascript
 db.getCollectionNames().forEach(function(collection) {
   indexes = db[collection].getIndexes();
   print("Indexes for " + collection + ":");
   printjson(indexes);
});
```

## STAT-PAGEVIEW-DAILY

```javascript
db.createCollection("STAT-PAGEVIEW-DAILY");
db["STAT-PAGEVIEW-DAILY"].createIndex( { documentId: 1, blockchainDate: 1 })
db["STAT-PAGEVIEW-DAILY"].createIndex( { blockchainDate: 1 })
db["STAT-PAGEVIEW-DAILY"].createIndex( { blockchainTimestamp: 1 })

```

## STAT-PAGEVIEW-TOTALCOUNT-DAILY

```javascript
db.createCollection("STAT-PAGEVIEW-TOTALCOUNT-DAILY");
db["STAT-PAGEVIEW-TOTALCOUNT-DAILY"].createIndex( { blockchainDate: 1 })

```

## VERIFY-EMAIL

```javascript
db.createCollection("VERIFY-EMAIL");
db["VERIFY-EMAIL"].createIndex( { email: 1 })
db["VERIFY-EMAIL"].createIndex( { verify: 1, created: 1 })

```

## EVENT-REGISTRY

```javascript
db.createCollection("EVENT-REGISTRY");
db["EVENT-REGISTRY"].createIndex( { blockNumber: -1 })
```


## EVENT-WRITEPAGEVIEW

```javascript
db.createCollection("EVENT-WRITEPAGEVIEW");
db["EVENT-WRITEPAGEVIEW"].createIndex( { blockNumber: -1 })
```

## SEND-EMAIL

```javascript
db.createCollection("SEND-EMAIL");
db["SEND-EMAIL"].createIndex( { email: 1, created: 1 });
db["SEND-EMAIL"].createIndex( { email: 1, emailType: 1 }, {unique: true});
```