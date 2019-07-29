# Docker BUild

## build command
```shell
docker build [OPTIONS] PATH | URL | -
```

docker build -t app .
-t(--tag) : 생성할 이미지 명

## lambda-builder

```shell
docker build -t decompany-lambda-builder .
``` 


## pdf-converter

```shell
docker build -t decompany-pdf-converter .
docker run -it -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace decompany-pdf-converter:latest /bin/bash
```

```shell
docker run -d -v /Users/jay/Downloads/POConvertLibrary_centos_x64_20190521:/workspace -p 8080:8080 --name pdf-converter decompany-pdf-converter:latest
```

