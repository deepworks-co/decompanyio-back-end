# 이관하기
## dump

```
mongodump --db=decompany --excludeCollection=EVENT-BLOCK --excludeCollection=EVENT-REGISTRY --excludeCollection=EVENT-WRITEPAGEVIEW --archive=dump.20200422.db
```

## restore

```
mongorestore --host dev-cluster-shard-0/dev-cluster-shard-00-00-brqwy.mongodb.net:27017,dev-cluster-shard-00-01-brqwy.mongodb.net:27017,dev-cluster-shard-00-02-brqwy.mongodb.net:27017 --ssl --username decompany --password decompany1234 \
--authenticationDatabase admin --archive=./dump.20200422.db
```


mongorestore --host dev-cluster-shard-0/dev-cluster-shard-00-00-brqwy.mongodb.net:27017,dev-cluster-shard-00-01-brqwy.mongodb.net:27017,dev-cluster-shard-00-02-brqwy.mongodb.net:27017 --ssl --username decompany --password decompany1234 \
--authenticationDatabase admin --numParallelCollections=2 --archive=./dump.20200422.db -c TOPTAG -d decompany