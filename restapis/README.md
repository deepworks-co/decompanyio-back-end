# decompanyio-back-end

Serverless Project

## Serverless에서 지원하지 않는 기능은 따로 설정함

1) Api gateway accesslog 설정
2) S3 WebHosting을 위한 BucketPolicy 설정
```javascripy
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::{bucket}/*"
        }
    ]
}
```

## Install dependency

```shell
npm install ../decompany-modules/decompany-common-utils/
npm install serverless-mocha-plugin
npm install serverless-offline
npm install serverless-plugin-existing-s3
npm install serverless-aws-documentation
npm install mongojs
npm install json-2-csv
```

## Install Layer

```shell
npm --prefix ./opt install sharp
```

# Running Offline

sls offline start

# Build using docker

cd {project_dir}
sudo node ../docker-npm.js rebuild

# Local에서 layer 사용하기

export NODE_PATH=.:./opt/node_modules

# Deploy

sls deploy

# Deploy by function

serverless deploy function -f trackingCollect

# show deploy function list

sls deploy list

# Test

sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount

# Log
sls logs -f {FunctionName}  -t
sls logs -f registYesterdayViewCount  -t

# serverless-mocha-plugin

## create function history 틀릴수도 있음~

sls create function -f accountSync --handler controllers/account/sync.handler --httpEvent "get /api/account/sync"
sls create function -f accountUpdate --handler controllers/account/update.handler --httpEvent "post /api/account/update"
sls create function -f accountGet --handler controllers/account/get.handler --httpEvent "post /api/account/get"
sls create function -f accountPicture --handler controllers/account/picture.handler --httpEvent "post /api/account/picture"
sls create function -f s3DocumentUploadComplete --handler s3/document/create.handler
sls create function -f s3DocumentConvertComplete --handler s3/document/create.handler
sls create function -f s3DocumentMetaInfo --handler s3/document/create.handler
sls create function -f tagList --handler controllers/tag/list.handler --httpEvent "get /api/tags"
sls create function -f analyticsList --handler controllers/analytics/list.handler --httpEvent "get /api/analytics/list"
sls create function -f analyticsExport --handler controllers/analytics/export.handler --httpEvent "get /api/analytics/export"
sls create function -f zapierEmail --handler controllers/zapier/email.handler --httpEvent "post /api/zapier/email"
sls create function -f zapierAuth --handler controllers/zapier/auth.handler
sls create function -f curatorDocumentList --handler controllers/curator/curatorDocumentList.handler --httpEvent "post /api/curator/document/list"
sls create function -f curatorTodayDocumentList --handler controllers/curator/curatorTodayDocumentList.handler --httpEvent "post /api/curator/document/today"
sls create function -f profileGetByNoAuth --handler controllers/profile/userGetByNoAuth.handler --httpEvent "get /api/profile/get"
sls create function -f documentUpdate --handler controllers/document/documentUpdate.handler --httpEvent "post /api/document/update"
sls create function -f documentMigration --handler migration/documentMigration.handler
sls create function -f accountEthereumSync --handler controllers/account/accountEthereumSync.handler --httpEvent "post /api/account/ethereumSync"
sls create function -f trackingExport --handler controllers/tracking/trackingExport.handler --httpEvent "get /api/tracking/export"



