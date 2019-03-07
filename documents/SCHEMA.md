# SCHEMA

## USER Collection

db.createCollection("USER");
db.USER.createIndex({email: 1}, {unique:true})
db.USER.createIndex({username: 1}, {unique:true})
db.USER.createIndex({sub: 1}, {unique:true})

## DOCUMENT COLLECTION

db.createCollection("DOCUMENT");
db.DOCUMENT.createIndex({documentId: 1}, {unique: true})
db.DOCUMENT.createIndex({created: -1})
db.DOCUMENT.createIndex({seoTitle: 1}, {unique: true});
db.DOCUMENT.createIndex({accountId: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, confirmAuthorReward: -1})
db.DOCUMENT.createIndex({state: 1, confirmVoteAmount: -1})
db.DOCUMENT.createIndex({state: 1, latestPageview: -1})

## SEO-FRIENDLY

db.createCollection("SEO-FRIENDLY")
db["SEO-FRIENDLY"].createIndex({{created: -1}})


## DOCUMENT-VOTE (cur DEV-CA-DOCUMENT-VOTE)

db.createCollection("VOTE");
db["DOCUMENT-VOTE"].createIndex({id: 1, created: -1}, {unique:true})
db["DOCUMENT-VOTE"].createIndex({created: -1})
db["DOCUMENT-VOTE"].createIndex({documentId: 1, created: -1})

## DOCUMENT-TRACKING

db.createCollection("DOCUMENT-TRACKING");
db["DOCUMENT-TRACKING"].createIndex({id: 1, cid: 1, sid: 1, created: -1})
db["DOCUMENT-TRACKING"].createIndex({id: 1, cid: 1, sid: 1, t: 1})


## DOCUMENT-TRACKING-USER

db.createCollection("DOCUMENT-TRACKING-USER");
db["DOCUMENT-TRACKING-USER"].createIndex({id: 1})
db["DOCUMENT-TRACKING-USER"].createIndex({id: 1, cid: 1})


## TOP-TAG

db.createCollection("TOP-TAG");
db["TOP-TAG"].createIndex({value: -1})

## query collection's index

```javascript
 db.getCollectionNames().forEach(function(collection) {
   indexes = db[collection].getIndexes();
   print("Indexes for " + collection + ":");
   printjson(indexes);
});
```