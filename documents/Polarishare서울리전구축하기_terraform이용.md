
1. 테라폼을 이용하여 VPC 구축
```bash
cd terraform/asem
terraform init
terrafor apply
```

2. sqs endpoint 생성
  - 테라폼을 이용하여 생성된 VPC를 확인후 생성

3. 개발용 방화벽 열기 sg_ssh, sg_mongodb(옵션)
  - 개발 환경을 위하여 현재 개발 PC가 위치한 ip를 확인하여 방화벽을 열어준다.~

4. mongodb 생성
  - 복사한 AMI를 이용하여 mongodb 인스턴스를 구동한다.
  
5. serverless application 배포
  - lambda-layer 배포
  - restapis 배포
  - restapis-graphql 배포
  - converter-wrapper 배포(주의)
    : converter-wrapper-master과의 연계 확인
  - batch-pageview 배포

6. update용 Bucket생성
```bash
  aws s3 mb s3://asem-ko-document --region ap-northeast-2
  aws s3 mb s3://asem-ko-upload-profile --region ap-northeast-2
  aws s3 mb s3://asem-ko-profile --region ap-northeast-2

```
  - CORS 설정

  document, upload-profile
  ```bash
  <?xml version="1.0" encoding="UTF-8"?>
  <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
      <AllowedOrigin>*</AllowedOrigin>
      <AllowedMethod>GET</AllowedMethod>
      <AllowedMethod>PUT</AllowedMethod>
      <AllowedMethod>POST</AllowedMethod>
      <AllowedHeader>*</AllowedHeader>
  </CORSRule>
  </CORSConfiguration>
  ```

7. SQS 생성
   ```
  aws sqs create-queue --queue-name asem-ko-convert-image --region ap-northease-2
  aws sqs create-queue --queue-name asem-ko-pdf-converter --region ap-northease-2
  ```

8. step function 생성 및 cloudwatch events 생성하기
  - step function defintion
    ```json
    {
      "StartAt": "DailyAggregatePageview",
      "TimeoutSeconds": 60,
      "States": {
        "DailyAggregatePageview": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:ap-northeast-2:197966029048:function:batch-pageview-asem-dailyPageview:$LATEST",
          "Next": "IsExistsAggregatePageview",
          "InputPath": "$",
          "ResultPath": "$"
        },
        "IsExistsAggregatePageview": {
          "Type": "Choice",
          "Choices": [
            {
              "Variable": "$.remains",
              "NumericGreaterThan": 0,
              "Next": "WriteOnchain"
            }
          ],
          "Default": "Success"
        },
        "WriteOnchain": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:ap-northeast-2:197966029048:function:batch-pageview-asem-pageviewWriteOnchain:$LATEST",
          "Next": "IsLeftDocumentsWrittenOnchain",
          "InputPath": "$",
          "ResultPath": "$"
        },
        "IsLeftDocumentsWrittenOnchain": {
          "Type": "Choice",
          "Choices": [
            {
              "Variable": "$.remains",
              "NumericGreaterThan": 0,
              "Next": "WriteOnchain"
            }
          ],
          "Default": "Success"
        },
        "Success": {
          "Type": "Succeed"
        }
      }
    }
    ```
  - schedule
    : 10 00 * * ? *