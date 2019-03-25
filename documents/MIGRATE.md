# Target Collections for MIGRATION
DEV-CA-DOCUMENT
DEV-CA-DOCUMENT-VOTE
DEV-CA-CRONHIST-TOTALVIEWCOUNT

# Index
DEV-CA-DOCUMENT
DEV-CA-DOCUMENT-VOTE
DEV-CA-CRONHIST-TOTALVIEWCOUNT

# DEV-CA-DOCUMENT-VOTE 테이블의 documentInfo 항목 제거(DEV-CA-DOCUMENT 테이블과 조인함)
db["DEV-CA-DOCUMENT-VOTE"].update({}, {$unset: {documentInfo: ""}}, {multi: true});

# ETC

#login admin
use admin
db.createUser({
  user: "root",
  pwd: "1234",
  roles: [ { role: "root", db: "admin" } ]
})

db.auth("root", "1234")

#create database and create user
use decompany
db.createUser(
   {
     user: "decompany",
     pwd: "decompany1234",
     roles: [{role: "readWrite", db: "decompany"} ]
   }
)
db.auth("decompany", "decompany1234")

#create table
db.createCollection("DEV-CA-DOCUMENT", { capped: false,
                              size: <number>,
                              max: <number>,
                              storageEngine: <document>,
                              validator: <document>,
                              validationLevel: <string>,
                              validationAction: <string>,
                              indexOptionDefaults: <document>,
                              viewOn: <string>,
                              pipeline: <pipeline>,
                              collation: <document>,
                              writeConcern: <document>} )

 




## DOCUMENT Collection _id 값을 documentId로 변경

```javascript
db["DEV-CA-DOCUMENT"].find().forEach( function (x) {
  x._id = x.documentId
  db["DEV-CA-DOCUMENT"].save(x);
});
```



```javascript
db["DOCUMENT-TRACKING"].find({useragnet:{$exists:1}}).forEach( function (x) {
  x.useragent = x.useragnet;
  db["DOCUMENT-TRACKING"].save(x);
});

db["DOCUMENT-TRACKING"].update({}, {$unset: {useragnet: ""}}, {multi: true});
```



```javascript
db.DOCUMENT.find({accountId:"jay@decompany.io", state:"CONVERT_COMPLETE"}).forEach(function(x){
  x.state="NONE"
  db.DOCUMENT.save(x);
})
```