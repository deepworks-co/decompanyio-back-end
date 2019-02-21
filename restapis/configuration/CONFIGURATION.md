# Configure

## api gateway stage custom access log enable

aws apigateway update-stage \
--rest-api-id "j5hgenjo04" \
--stage-name "dev" \
--cli-input-json "file://api-gateway-custom-accesslog-format.json"

## API GATEWAY Custom Access Log Format

{ "requestId":"$context.requestId", "ip": "$context.identity.sourceIp", "caller":"$context.identity.caller", "user":"$context.identity.user","userAgent":"$context.identity.userAgent", "requestTime":"$context.requestTime", "requestTimeEpoch":"$context.requestTimeEpoch", "httpMethod":"$context.httpMethod","resourcePath":"$context.resourcePath", "path":"$context.path", "responseLatency":"$context.responseLatency", "status":"$context.status","protocol":"$context.protocol", "responseLength":"$context.responseLength" }

## CloudWatch Custom Access Log Subscriptions to kinesis data stream

aws logs put-subscription-filter \
    --log-group-name "us-west-1-backend-restapis-AccessLogGroup" \
    --destination-arn "arn:aws:kinesis:us-east-1:197966029048:stream/AccessLogRestApiStream" \
    --role-arn "arn:aws:iam::197966029048:role/CWLtoKinesisRole" \
    --filter-name "backend-restapis"  \
    --filter-pattern ""

## subscriptions to kinesis firehose delivery stream


## CloudWatch Log to Subscription

### to S3

aws logs put-subscription-filter \
    --log-group-name "us-west-1-backend-restapis-AccessLogGroup" \
    --filter-name "backend-restapis" \
    --filter-pattern "" \
    --destination-arn "arn:aws:firehose:us-east-1:197966029048:deliverystream/AccessLogDeliveryStream" \
    --role-arn "arn:aws:iam::197966029048:role/CWLtoKinesisFirehoseRole"

### to Redshift

aws logs put-subscription-filter \
    --log-group-name "us-west-1-backend-restapis-AccessLogGroup" \
    --filter-name "backend-restapis" \
    --filter-pattern "" \
    --destination-arn "arn:aws:firehose:us-east-1:197966029048:deliverystream/AccessLogToRedshiftDeliveryStream" \
    --role-arn "arn:aws:iam::197966029048:role/CWLtoKinesisFirehoseRole"

## API Document download

serverless downloadDocumentation --outputFileName='../documents/restapis-document.yml' -s dev


## Create firhose delivery stream cross regions

### get skeleton

aws firehose create-delivery-stream --cli-input-json "file://cli-skeleton.json"

### create delivery stream : TrackingDeliveryStream
 
- kinesis stream source
aws firehose create-delivery-stream --cli-input-json "file://create_firehose_delivery_for_s3.json"

### Firehose Put Record for Test 
aws firehose put-record --delivery-stream-name TrackingDeliveryStream --record '{"Data":"{\"id\":\"abc\",\"cid\":\"abc\",\"sid\":\"abc\",\"t\":1550468013093}"}'


### Kinesis Put Record for Test 
aws kinesis put-record --stream-name TrackingDataStream --data '{"Data":"{\"id\":\"abc\",\"cid\":\"abc\",\"sid\":\"abc\",\"t\":1550468013093}"}' --partition-key 'test'


