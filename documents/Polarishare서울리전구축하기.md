1. VPC생성
  1) Endpoint 생성
    - S3
    - SQS
      : Security Group 생성 및 lambda Inbound 허용 필요
    - Kineis-stream
      : Security Group 생성 및 lambda Inbound 허용 필요

2. SQS 생성
  1) asem-ko-convert-image
  2) asem-ko-pdf-converter
  서울리전 SQS 생성하기
  ```
  aws sqs create-queue --queue-name asem-ko-convert-image --region ap-northease-2
  aws sqs create-queue --queue-name asem-ko-pdf-converter --region ap-northease-2
  ```

  테스트용 일본 리전 SQS 생성하기
   ```
  aws sqs create-queue --queue-name jpdev-jp-convert-image --region ap-northease-1
  aws sqs create-queue --queue-name jpdev-jp-pdf-converter --region ap-northease-1
  ```


2. S3Bucket 생성 및 마이그레이션

  1) 서울 리전 버킷 생성
  
  ```bash
  aws s3 mb s3://asem-ko-document --region ap-northeast-2
  aws s3 mb s3://asem-ko-thumbnail --region ap-northeast-2
  aws s3 mb s3://asem-ko-profile --region ap-northeast-2
  aws s3 mb s3://asem-ko-upload-profile --region ap-northeast-2
  aws s3 mb s3://asem-ca-upload-document --region us-west-1
  ```

  테스트용 일본 리전 버킷 생성
```bash
aws s3 mb s3://jpdev-jp-document --region ap-northeast-1
aws s3 mb s3://jpdev-jp-thumbnail --region ap-northeast-1
aws s3 mb s3://jpdev-jp-profile --region ap-northeast-1
aws s3 mb s3://jpdev-jp-upload-profile --region ap-northeast-1
```

  2) 버킷 마이그레이션(alpha->asem)

  ```bash
  aws s3 sync s3://alpha-ca-document s3://asem-ko-document
  aws s3 sync s3://alpha-ca-thumbnail s3://asem-ko-thumbnail
  aws s3 sync s3://alpha-ca-profile s3://asem-ko-profile
  aws s3 sync s3://alpha-ca-upload-profile s3://asem-ko-upload-profile
  ```

  ```bash
  aws s3 sync s3://alpha-ca-document s3://jpdev-jp-document
  aws s3 sync s3://alpha-ca-thumbnail s3://jpdev-jp-thumbnail
  aws s3 sync s3://alpha-ca-profile s3://jpdev-jp-profile
  aws s3 sync s3://alpha-ca-upload-profile s3://jpdev-jp-upload-profile
  ```

  3) CORS 설정

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
  
3. MongoDB 마이그레이션
  1) 복사한 AMI를 이용하여 mongodb 인스턴스를 구동한다.

4. API Gateway + Lamabda 어플리케이션 생성

  1) lambda-layer 설치
    - sharp모듈의 경우 람다 runtime에서 Build 해야 한다.
      > https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/lambda-runtimes.html

    - sls deploy
    ```bash
    cd lambda-layer
    sls deploy -s asem -r ap-northeast-2
    ```

    - 생성된 layer 정보를 app-properties 의 layer항목에 기입

  2) converter-wrapper 설치

    ```bash
  cd converter-wrapper
  npm run deploy:asem
  ```

  3) restapis 설치
  ```bash
  cd restapis
  npm run deploy:asem
  ```
  

5. Image Converter 설치
6. PDF Converter 설치
