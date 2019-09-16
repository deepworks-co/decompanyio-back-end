
# Local에서 이미지 변환 테스트 하기

## Install Layer

```shell
npm --prefix ./opt install sharp
```

## Local에서 layer 사용하기

```shell
export NODE_PATH=.:./opt/node_modules
```


## 테스트

```bash
sls invoke test -f s3DocumentConvertComplete
```