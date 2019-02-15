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

 
#create index
#USER Collection
db.createCollection("USER");
db.USER.createIndex({id: 1}, {unique:true})
db.USER.createIndex({sub: 1}, {unique:true})

#DOCUMENT (cur DEV-CA-DOCUMENT)
db.createCollection("DOCUMENT");
db.DOCUMENT.createIndex({documentId: 1}, {unique:true})
db.DOCUMENT.createIndex({created: -1})
db.DOCUMENT.createIndex({accountId: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, created: -1})
db.DOCUMENT.createIndex({state: 1, confirmAuthorReward: -1})
db.DOCUMENT.createIndex({state: 1, confirmVoteAmount: -1})

#VOTE (cur DEV-CA-DOCUMENT-VOTE)
db.createCollection("VOTE");
db.VOTE.createIndex({id: 1, created: -1}, {unique:true})
db.VOTE.createIndex({created: -1})
db.VOTE.createIndex({documentId: 1, created: -1})


#DOCUMENT-TRACKING
db.createCollection("DOCUMENT-TRACKING");
db["DOCUMENT-TRACKING"].createIndex({id: 1, cid: 1, sid: 1, created: -1})
db["DOCUMENT-TRACKING"].createIndex({id: 1, cid: 1, sid: 1, t: 1})
 

#query collection's index
 db.getCollectionNames().forEach(function(collection) {
   indexes = db[collection].getIndexes();
   print("Indexes for " + collection + ":");
   printjson(indexes);
});

