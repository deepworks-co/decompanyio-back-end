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

2. S3Bucket 생성 및 마이그레이션

  1) 버킷 생성
  
  ```bash
  aws s3 mb s3://asem-ko-document --region ap-northeast-2
  aws s3 mb s3://asem-ko-thumbnail --region ap-northeast-2
  aws s3 mb s3://asem-ko-profile --region ap-northeast-2
  aws s3 mb s3://asem-ko-upload-profile --region ap-northeast-2
  aws s3 mb s3://asem-ca-upload-document --region us-west-1
  ```

  2) 버킷 마이그레이션(alpha->asem)

  ```bash
  aws s3 sync s3://alpha-ca-document s3://asem-ko-document
  aws s3 sync s3://alpha-ca-thumbnail s3://asem-ko-thumbnail
  aws s3 sync s3://alpha-ca-profile s3://asem-ko-profile
  aws s3 sync s3://alpha-ca-upload-profile s3://asem-ko-upload-profile
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

3. API Gateway + Lamabda 어플리케이션 생성

  1) lambda-layer 설치

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
  
4. MongoDB 마이그레이션
5. Image Converter 설치
6. PDF Converter 설치
