# Docker BUild

## build command
```shell
docker build [OPTIONS] PATH | URL | -
```

docker build -t app .
-t(--tag) : 생성할 이미지 명

-----

##  lambda-builder

###    AWS Lambda 빌드를 위한 Docker Image

```shell
docker build -t decompany-lambda-builder .
docker run -it decompany-lambda-builder /bin/bash
```

------

## pdf-converter


pdf converter용 base 이미지 생성하기 decompany/pdf-converter-base
```
docker build --no-cache -f Dockerfile-base -t decompany/pdf-converter-base .

docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash

```

이미지 생성 및 컨테이너 /bin/bash 실행하기

```shell
docker build -t decompany/pdf-converter .

docker run --rm -p 8080:8080 --name pdf-converter decompany/pdf-converter
```

개발 debug mount 모드
```shell
docker build -f Dockerfile-dev -t decompany/pdf-converter-dev .

docker run --rm \
-v /Users/jay/.aws:/root/.aws \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/batch-application:/batch-application \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/decompany-modules:/decompany-modules \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/po-converter-library_centos_x64_20190521:/converter \
-p 8080:8080 --name pdf-converter decompany/pdf-converter-dev

```

개발용 interactive 모드

```shell
docker run -it --rm \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/batch-application:/batch-application \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/po-converter-library_centos_x64_20190521:/converter \
-p 8080:8080 --name pdf-converter decompany/pdf-converter /bin/bash
```

background 실행하기

```shell
docker run -d -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace -p 8080:8080 --name pdf-converter decompany-pdf-converter:latest

docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash

docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter /bin/bash
```

PDF & PNG 변환하기

```
java -jar PolarisConverter8.jar PDF rsa.ppt rsa.pdf 1280 1280 ./temp
java -jar PolarisConverter8.jar PNG rsa.ppt ./temp 1280 1280 ./rsa_ppt 
```