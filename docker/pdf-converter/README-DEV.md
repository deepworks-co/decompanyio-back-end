# Docker BUild

* build command

```bash
docker build [OPTIONS] PATH | URL | -


docker build -t app .
-t(--tag) : 생성할 이미지 명
```

-----

* pdf-converter

    * pdf converter용 base 이미지 생성하기 decompany/pdf-converter-base

        ```bash
        docker build --no-cache -f Dockerfile-base -t decompany/pdf-converter-base .

        docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash 
        ```

    * 이미지 생성 및 컨테이너 /bin/bash 실행하기

        ```shell
        docker build -t decompany/pdf-converter .

        docker run --rm -p 8080:8080 --name pdf-converter decompany/pdf-converter
        ```

## 개발 환경 실행


* 개발 debug mount 모드 이미지 생성
```shell
    docker build -f Dockerfile-dev -t decompany/pdf-converter-dev .
```

* 개발 debug mount 모드 이미지 실행

```bash
    docker run --rm \
    -e QUEUE_URL='https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-pdf-converter' \
    -e REGION=us-west1 \
    -e WORK_DIR_PREFIX='/cronwork' \
    -e EXPRESSION='*/1 * * * * *' \
    -v /Users/jay/.aws:/root/.aws \
    -v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/batch-application:/batch-application \
    -v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/decompany-modules:/decompany-modules \
    -v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/po-converter-library_centos_x64_20190521:/converter \
    -p 8080:8080 --name pdf-converter decompany/pdf-converter-dev
```

## 배포용 이미지 로컬 테스트 하기

* 이미지 생성
```bash
docker build -t decompany/pdf-converter .
```

* foreground 실행하기

```bash
docker run --rm -v /Users/jay/.aws:/root/.aws -p 8080:8080 decompany/pdf-converter
```

* background 실행하기

```bash
docker run -d --rm -v /Users/jay/.aws:/root/.aws -p 8080:8080 --name pdf-converter decompany/pdf-converter
```


엔진 명령 사용하기 - PDF & PNG 변환하기
===

    ```bash
    java -jar PolarisConverter8.jar PDF rsa.ppt rsa.pdf 1280 1280 ./temp
    java -jar PolarisConverter8.jar PNG rsa.ppt ./temp 1280 1280 ./rsa_ppt 
    java -jar PolarisConverter8.jar PDF 20cc01e1d49d4bcebb3936cb5cb044ff.pptx 20cc01e1d49d4bcebb3936cb5cb044ff.pdf 1280 1280 ./temp
    ```

ecs cli 명령들 
===

1. Task조회하기
    ```bash
    aws ecs describe-task-sets --cluster decompany-pdfconverter-cluster --service pdf-converter-service
    ```


SQS Test Message 입력하기
===

* 메세지 보내기

    * ppt문서 변환하기 sample sqs

        ```bash
        aws sqs send-message \
        --queue-url https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-pdf-converter \
        --message-body '{
                "source": {
                    "bucket": "dev-ca-document",
                    "key": "FILE/google-oauth2|101778494068951192848/07637479b9874749a7e723fe949d3dad.pptx"
                },
                "target": {
                    "bucket": "dev-ca-document",
                    "key": "PDF/07637479b9874749a7e723fe949d3dad/07637479b9874749a7e723fe949d3dad.pdf"
                }
            }'
        ```
        * Error document sample
        ```bash
        aws sqs send-message \
        --queue-url https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-pdf-converter \
        --message-body '{
                "source": {
                    "bucket": "dev-ca-document",
                    "key": "FILE/google-oauth2|107070602776474268283/20cc01e1d49d4bcebb3936cb5cb044ff.pptx"
                },
                "target": {
                    "bucket": "dev-ca-document",
                    "key": "PDF/20cc01e1d49d4bcebb3936cb5cb044ff/20cc01e1d49d4bcebb3936cb5cb044ff.pdf"
                }
            }'
        ```

    * pdf문서 변환하기 sample sqs

        ```bash
        aws sqs send-message \
        --queue-url https://sqs.us-west-1.amazonaws.com/197966029048/alpha-ca-pdf-converter \
        --message-body '{
            "source": {
                "bucket": "dev-ca-document",
                "key": "FILE/google-oauth2|107070602776474268283/4cdb6c3b75db41f19571ab6d9cd5a821.pdf"
            },
            "target": {
                "bucket": "dev-ca-document",
                "key": "PDF/4cdb6c3b75db41f19571ab6d9cd5a821/4cdb6c3b75db41f19571ab6d9cd5a821.pdf"
            }
        }'
        ```
