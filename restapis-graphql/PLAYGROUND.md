# Example

## Guide

https://blog.apollographql.com/4-simple-ways-to-call-a-graphql-api-a6807bcdb355

## Mutation

```javascript

mutation {
  UserDocumentHistory {
    removeById(_id: "5d6773efe0cd80686348c92a"){
      recordId
    }
  }
}

```

```javascript

mutation {
  UserDocumentHistory {
    removeOne(filter: {userId:"5a"}) {
      recordId
    },
    createOne(record: {userId: "5a", documentId: "documentId1111"}) {
      recordId
      record {
        userId
        documentId
      }
    }
  }
}

```

## Query

```javascript
query {
  getDocument: Document {
    findById(_id: "fdc219a700c344469fa076b5bbac4d08"){
      _id
      title
      seoTitle
      desc
    }
  },
  getUser: User {
    findById(_id: "fdc219a700c344469fa076b5bbac4d08"){
      _id
      email
    }
  },
  getDocuments: Document {
      findMany(filter: {state: CONVERT_COMPLETE, isPublic: false},
      sort: STATE__CREATED_DESC){
      _id
      state
      title
      seoTitle
      desc
      isPublic
      created
    }
  }
}
```

```javascript
query {
   Document {
    findById(_id: "fdc219a700c344469fa076b5bbac4d08"){
      _id
      title
      seoTitle
      desc
      documentId
    },
    findOne(filter: {seoTitle:"sample-cou0o3"}) {
      _id
      title
      seoTitle
      desc
      documentId
      accountId
    }
  },
  User {
    findById(_id: "google-oauth2|101778494068951192848"){
      _id
      email
    }
  }
}
```
