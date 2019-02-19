# ver 3.6 over

## create table DOCUMENT

```javascript
db.createCollection("DOCUMENT", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: [ "documentId", "created", "accountId", "status"],
         properties: {
            documentId: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            created: {
               bsonType: "long",
               description: "must be a long(32-bit integer) and is required"
            },
            accountId: {
               bsonType: "string",
               description: "must be an string and is required"
            },
            status: {
               enum: [ "NOT_CONVERT", "CONVERT_COMPLETE", "CONVERT_ERROR", null ],
               description: "can only be one of the enum values and is required"
            }

         }
      }
   }
})
```

```javascript
db.runCommand( {
   collMod: "DEV-CA-DOCUMENT",
   validator: { $jsonSchema: {
      bsonType: "object",
         required: [ "documentId", "created", "accountId", "status"],
         properties: {
            documentId: {
               bsonType: "string",
               description: "must be a string and is required"
            },
            created: {
               bsonType: "long",
               description: "must be a long(32-bit integer) and is required"
            },
            accountId: {
               bsonType: "string",
               description: "must be an string and is required"
            },
            status: {
               enum: [ "NOT_CONVERT", "CONVERT_COMPLETE", "CONVERT_ERROR", null ],
               description: "can only be one of the enum values and is required"
            }
         }
      }
   }
} )
```

## ver 3.2

```javascript
db.runCommand( {
   collMod: "DOCUMENT-TRACKING",
   validator: {
       $and: [
           { id: { $exists: true } },
           { cid: { $exists: true } },
           { sid: { $exists: true } },
           { created: { $exists: true }}
        ]
   }
} )
```