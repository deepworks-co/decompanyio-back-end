# MongoDB


## Current Op Query

```javascript

db.currentOp({"secs_running": {$gte: 1}})

```

## Profiler Overheader

When enabled, profiling has a minor effect on performance. The system.profile collection is a capped collection with a default size of 1 megabyte. A collection of this size can typically store several thousand profile documents, but some applications may use more or less profiling data per operation.

Change Size of system.profile Collection on the Primary
To change the size of the system.profile collection, you must:

Disable profiling.
Drop the system.profile collection.
Create a new system.profile collection.
Re-enable profiling.
For example, to create a new system.profile collections that’s 4000000 bytes, use the following sequence of operations in the mongo shell:
https://docs.mongodb.com/manual/tutorial/manage-the-database-profiler/

### configuration profile

```javascript
db.setProfilingLevel(0)
db.system.profile.drop()
db.createCollection( "system.profile", { capped: true, size:4000000 } )
db.setProfilingLevel(1)
```

### query profiles

```javascript
db.system.profile.find({millis: {$gt: 500}}).limit(10).sort( { ts : -1 } ).pretty()
```

## Replicaset configuration
master에서 아래 command를 실행한다.

```javascript
rs.initiate(
           {
      _id: "rstest01",
      members: [
         { _id: 0, host : "172.31.47.203:27017" },
         { _id: 1, host : "172.31.44.58:27017" },
         { _id: 2, host : "172.31.34.15:27017" }
      ]
   }
)
```

## 상태 보기

```javascript
rs.status()
```

## slaveOK 

```javascript
slave에서 아래 command를 실행한다.
>rs.slaveOk()
```