# 도커 인스턴스에서 엔진을 테스트 해보자 

## 사전조건

> 1) decompany/pdf-converter 이미지가 생성되어 있어야함(../README.md 참조)

## 엔진 실행용 Image를 실행하기(/bin/bash)

```bash
docker run -it --rm \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/batch-application:/batch-application \
-v /Users/jay/Documents/infraware/work/workspace-git/decompanyio-back-end/docker/pdf-converter/POConvertLibrary_centos_x64_20191007:/converter \
-p 8080:8080 --name pdf-converter decompany/pdf-converter /bin/bash
```

## 이미지 변환

```bash
java -jar PolarisConverter8.jar PNG rsa.ppt ./temp 1280 1280 ~/temp
```

## Text 추출

```bash
java -jar PolarisConverter8.jar TEXT rsa.ppt ./temp 1280 1280 ~/temp
```


## PDF 변환

```bash
java -jar PolarisConverter8.jar PDF rsa.ppt ./temp/rsa.pdf 1280 1280 ~/temp
```