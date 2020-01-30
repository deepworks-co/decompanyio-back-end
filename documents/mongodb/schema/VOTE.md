# VOTE

```javascript
db.createCollection("VOTE");
db.runCommand({
  collMod: "VOTE",
  validator: {
    $jsonSchema : {
    bsonType : "object",
    required : [
      "documentId", "userId", "deposit", "created"
    ],
    properties : {
			documentId : {
					bsonType : "string",
					description : "document id"
			},
			userId : {
				bsonType : "string",
        description : "user id"
			},
			deposit : {
				bsonType : "decimal",
				description : "wei"
			},
			created : {
				bsonType : "number",
				description : "datetime"
			}
		}
	}
  },
  validationLevel: "strict", //off | 
  //validationAction: "warn" |"error"
})

db["VOTE"].createIndex( { userId: 1, created: -1 })
db["VOTE"].createIndex( { documentId: 1, created: -1 })

```