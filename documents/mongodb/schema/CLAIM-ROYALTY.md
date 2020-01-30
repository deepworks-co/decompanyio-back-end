# CLAIM-ROYALTY

```javascript
db.runCommand( {
  collMod: "CLAIM-ROYALTY",
  validator: {
    $jsonSchema : {
    bsonType : "object",
    required : [
      "blockchainTimestamp", 'value', "created"
		],
    properties : {
			id: {
				properties: {
					year : {
						bsonType : "number",
						description : "year"
					},
					month : {
						bsonType : "number",
						description : "year"
					},
					dayOfMonth: {
						bsonType : "number",
						description : "year"
					},
					userId: {
						bsonType : "string",
						description : "string"
					},
					documentId: {
						bsonType : "string",
						description : "documentId"
					},
				}  
      },
			blockchainTimestamp : {
					bsonType : "number",
					description : "UTC yyyy-mm.-ddT00:00:00 to timestamp"
			},
			value : {
				bsonType : "decimal",
				description : "wei"
			},
			created : {
				bsonType : "number",
				description : "timestamp"
			}
		}
	}
  },
  validationLevel: "strict", //off | 
  //validationAction: "warn" |"error"
})

db["CLAIM-ROYALTY"].createIndex({"_id.userId" : 1, "_id_documentId": 1});
db["CLAIM-ROYALTY"].createIndex({blockchainTimestamp : 1});

``` 
