# WALLET

```javascript
db.runCommand( {
  collMod: "WALLET",
  validator: {
    $jsonSchema : {
    bsonType : "object",
    required : [
      "type", "factor", 'value', "created"
    ],
    properties : {
			userId : {
					bsonType : "string",
					description : "user id"
			},
			address : {
					bsonType : "string",
					description : "user's eoa(ethereum account)"
			},
			type : {
				bsonType : "string",
				enum: [ "WITHDRAW", "DEPOSIT", "VOTE", "REWARD", "ROYALTY" ],
			},
			factor : {
				bsonType : "int",
				enum: [ 1, -1 ],
				description : "negative positive"
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

db["WALLET"].createIndex({address : 1, created: -1});
db["WALLET"].createIndex({userId : 1, created: -1});

``` 
