# Docker BUild

## build command
```shell
docker build [OPTIONS] PATH | URL | -
```

docker build -t app .
-t(--tag) : 생성할 이미지 명

-----

## AWS Lambda 8.10 빌드를 위한 Docker Image

  1) docker image 생성

  ```bash
  docker build -d -t decompany-lambda-builder .
  docker run -it decompany-lambda-builder /bin/bash
  ```

  2) AWS ECR 등록하기

  3) docker image를 ECR에 업로드

------

## pdf-converter

  1) pdf converter용 base 이미지 생성하기 decompany/pdf-converter-base

  ```bash
  docker build --no-cache -f Dockerfile-base -t decompany/pdf-converter-base .
  docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash
  ```

  2) 이미지 생성 및 컨테이너 /bin/bash 실행하기

  ```bash
  docker build -t decompany/pdf-converter .
  docker run --rm -p 8080:8080 --name pdf-converter decompany/pdf-converter
  ```

  3) 개발 debug mount 모드
  
  ```bash
  docker build -f Dockerfile-dev -t decompany/pdf-converter-dev .

  docker run --rm \
  -v /Users/jay/.aws:/root/.aws \
  -v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/batch-application:/batch-application \
  -v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/decompany-modules:/decompany-modules \
  -v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/po-converter-library_centos_x64_20190521:/converter \
  -p 8080:8080 --name pdf-converter decompany/pdf-converter-dev

  ```



background 실행하기

```bash
docker run -d -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace -p 8080:8080 --name pdf-converter decompany-pdf-converter:latest

docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash

docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash
```

PDF & PNG 변환하기

```bash
java -jar PolarisConverter8.jar PDF rsa.ppt rsa.pdf 1280 1280 ./temp
java -jar PolarisConverter8.jar PNG rsa.ppt ./temp 1280 1280 ./rsa_ppt 
```

## ECS Task Definition 설정시 주의사항(1vCPU=1024, 1gmb=1024)
> CPU 256 Memory 256 설정시 이미지 변환시 중단됨
> CPU 256 Memory 512 정도로 설정시 7 이미지 변환시 70초 정도 소요됨
> CPU 512 Memory 512 정도로 설정시 7 이미지 변환시 37초 정도 소요됨
> 현재 CPU 512 Memory 512로 설정해 놓음(2019. 12. 19)