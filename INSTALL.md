Install
=============

Architecture
-------------

> https://drive.google.com/file/d/1Q94ubwcRWHg7zRoyrFPLPckq-Y0NzQHV/view?usp=sharing


Prerequirement
-------------

1. nodejs 8.10 설치 

2. serverless 설치
    - https://serverless.com/framework/docs/providers/aws/guide/quick-start/
    - serverless install
        > npm install -g serverless

3. ide 선택하기
    - Atom
    - VisualCode

4. VPC 설정
    - serverless.yml 에 지정함

5. AWS CLI 설정 및 Accesskey, secretkey 설정

6. source
    - Backend : git clone https://github.com/decompanyio/decompanyio-back-end.git
    - Frontend : git clone https://github.com/decompanyio/decompanyio-front-end.git

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
        - region : SQS region
        - queueUrls :  이미지 변환시 사용될 SQS

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
        - endpoint : mongodb endpoint
    - region 설정 확인 (deploy될 region)
    - s3Config 설정 확인
        - document : 문서 업로드 전용
        - thumbnail : 문서 썸네일 서비스용
        - profile : 프로파일 이미지
        - upload_profile: 프로파일 이미지 업로드 전용
    - sqsConfig
        - region : SQS region
        - queueUrls :  이미지 변환시 사용될 SQS

----


5. Deploy restapis serverless
    > cd restapis
    > sls deploy

6. Deploy batch-pageview
    > cd batch-pageview
    > sls deploy

---


Post Install
-------------

1. batch-pageview 프로젝트의 아래 함수는 일반 서비스 관련 함수이다. 이외 다른 함수는 disable 시킨다.
    - dailyPageview
        - 일배치 전날의 pageview 집계
        - 현재 매일 오전 00: 10dp step function 배치에 의해 동작중
        - wc300에서 동작 시에는 주석되어 있는 events의 주석을 해제해주세요~ 현재는 step function으로 동작하기 때문에  주석처리 되어 있습니다.
    - recentlyPageview
        - 최근 오날자 pageview 집계
        - 5분마다 동작
    - generatePopular
        - 최근 n일간의(현재 7일) pageview 집계
        - 인기 목록을 생성함
    - generateFeatured
        - 최근 n일간의(현재 3일) vote 집계
        - 추천 목록을 생성함
    - generateTopTag
        - 모든 문서의 tag 랭킹 집계 
        - 5분마다 집계

2. 배포 
    - cd batch-pageview 
    - npm run deploy

Image Converter
-------------

1. 환경설정
    - 소스 : \\Cdt-16-0046\공유폴더
    - jdk1.7 / Tomcat7 / maven
    - PO Converter서버와 동일한 환경
2. maven build 및 package 생성
    - mvn clean package -DskipTests -Pdev