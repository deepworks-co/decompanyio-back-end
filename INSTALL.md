Install
=============

Prerequirement
-------------

1. nodejs 8.10 설치
    - aaa
    - bbb

2. serverless 설치
    - https://serverless.com/framework/docs/providers/aws/guide/quick-start/
    - serverless install
        > npm install -g serverless

3. ide 선택하기
    - Atom
    - VisualCode

4. VPC 설정
    - serverless.yml 에 지정함

4. AWS CLI 설정 및 Accesskey, secretkey 설정

GoGo
-------------

1. bucket 생성하기
    - decompany-app-proeprties 모듈의 *s3Config*의 아래 키에 해당하는 Bucket를 생성한다.
        - document : 문서 업로드 전용
        - thumbnail : 문서 썸네일 서비스용
        - profile : 프로파일 이미지
        - upload_profile: 프로파일 이미지 업로드 전용

-----

2. 문서 변환용 SQS 생성하기
    - app-properties의 sqsConfig
        - region :
        - queueUrls : 

-----

3. mongodb 설치하기
    - mongodb v4.0 community 설치
        - https://www.mongodb.com/download-center
    - collection 생성 및 index 생성
        - document SCHEMA.md 참조
    - endpoint 확인
----

4. decompany-app-properties 업데이트
    - applicationConfig
        - mainHost: 대표 DNS
    - mongodb
        - endpoint 
    - region 설정 확인 (deploy될 region)
    - s3Config 설정 확인

----


5. Deploy serverless
    > sls deploy
---
