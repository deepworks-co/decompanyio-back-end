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
npm install ../decompany-modules/decompany-app-properties/
npm install --save-dev serverless-mocha-plugin
npm install --save-dev serverless-offline
npm install --save-dev serverless-plugin-existing-s3
npm install --save-dev serverless-aws-documentation
npm install --save-dev serverless-plugin-split-stacks
npm install --save-dev serverless-plugin-canary-deployments
npm install --save-dev serverless-prune-plugin
npm install mongojs@2.6.0
npm install json-2-csv@3.5.4
npm install buffer-image-size@0.6.4
npm install request@2.88.0
npm install jsonwebtoken@8.5.1
npm --prefix ./opt install sharp@0.22.1
```

## Install Layer

```shell
npm --prefix ./opt install sharp
```

## Local에서 layer 사용하기

```shell
export NODE_PATH=.:./opt/node_modules
```


## Running Offline

sls offline start

## Build using docker

cd {project_dir}
sudo node ../docker-npm.js rebuild



## Deploy

sls deploy

## Deploy function

serverless deploy function -f trackingCollect

## show deploy function list

sls deploy list

## Test

sls invoke test -f {FunctionName}
sls invoke test -f registYesterdayViewCount

## Log

```shell
sls logs -f {FunctionName}  -t
sls logs -f registYesterdayViewCount  -t
```

## Exsiting S3 Plugin

```shell
sls deploy -s dev
```


## serverless-mocha-plugin

## create function history 틀릴수도 있음~

```shell
sls create function -f accountSync --handler controllers/account/sync.handler --httpEvent "get /api/account/sync"
sls create function -f accountUpdate --handler controllers/account/update.handler --httpEvent "post /api/account/update"
sls create function -f accountGet --handler controllers/account/get.handler --httpEvent "post /api/account/get"
sls create function -f accountPicture --handler controllers/account/picture.handler --httpEvent "post /api/account/picture"
sls create function -f accountPictureConverter --handler s3/account/accountPictureConverter.handler
sls create function -f accountDocuments --handler controllers/account/documents.handler --httpEvent "get /api/account/documents"
sls create function -f s3DocumentUploadComplete --handler s3/document/create.handler
sls create function -f s3DocumentConvertComplete --handler s3/document/create.handler
sls create function -f s3DocumentMetaInfo --handler s3/document/create.handler
sls create function -f tagList --handler controllers/tag/list.handler --httpEvent "get /api/tags"
sls create function -f analyticsList --handler controllers/analytics/list.handler --httpEvent "get /api/analytics/list"
sls create function -f analyticsExport --handler controllers/analytics/export.handler --httpEvent "get /api/analytics/export"
sls create function -f zapierEmail --handler controllers/zapier/email.handler --httpEvent "post /api/zapier/email"
sls create function -f zapierAuth --handler controllers/zapier/auth.handler
sls create function -f zapierDocument --handler controllers/zapier/document.handler --httpEvent "get /api/zapier/document"
sls create function -f curatorDocumentList --handler controllers/curator/curatorDocumentList.handler --httpEvent "post /api/curator/document/list"
sls create function -f curatorTodayDocumentList --handler controllers/curator/curatorTodayDocumentList.handler --httpEvent "post /api/curator/document/today"
sls create function -f profileGetByNoAuth --handler controllers/profile/userGetByNoAuth.handler --httpEvent "get /api/profile/get"
sls create function -f documentUpdate --handler controllers/document/documentUpdate.handler --httpEvent "post /api/document/update"
sls create function -f documentInfo --handler controllers/document/documentInfo.handler --httpEvent "get /api/document/info"
sls create function -f documentMeta --handler controllers/document/documentMeta.handler --httpEvent "get /api/document/meta"
sls create function -f documentMigration --handler migration/documentMigration.handler
sls create function -f accountEthereumSync --handler controllers/account/accountEthereumSync.handler --httpEvent "post /api/account/ethereumSync"
sls create function -f trackingExport --handler controllers/tracking/trackingExport.handler --httpEvent "get /api/tracking/export"
sls create function -f trackingConfirm --handler controllers/tracking/confirm.handler --httpEvent "get /api/tracking/confirm"
sls create function -f trackingSendEmail --handler controllers/tracking/sendEmail.handler
sls create function -f embededDocument --handler controllers/embeded/embededDocument.handler --httpEvent "get /api/embeded/document"
sls create function -f documentDownload --handler controllers/document/documentDownload.handler --httpEvent "get /api/document/download"

sls create function -f verifyEmailRequest --handler controllers/email/verifyEmailRequest.handler --httpEvent "get /api/email/verifyemailrequest"
sls create function -f verifyEmail --handler controllers/email/verifyEmail.handler --httpEvent "get /api/email/verifyemail"

sls create function -f bountyRequest --handler controllers/bounty/bountyRequest.handler --httpEvent "get /api/bounty/request"
sls create function -f bountyState --handler controllers/bounty/bountyState.handler --httpEvent "get /api/bounty/state"


```


## get resources count

```shell
aws cloudformation describe-stack-resources --stack-name backend-restapis-dev --query "StackResources[].ResourceType" --output text | tr "\t" "\n" | sort | uniq -c | sort -r
```