PDF Converter Image 생성하고 ECR에 등록하기
====

## PDF Converter 이미지 생성하기

* 기본 Runtime 이미지 생성

```bash
docker build --no-cache -f Dockerfile-base -t decompany/pdf-converter-base .
```

* Application 이미지 생성 (decompany/pdf-converter-base 이미지 기반)

```bash
docker build -t decompany/pdf-converter .
```

* Retrieve the login command to use to authenticate your Docker client to your registry.
Use the AWS CLI:

$(aws ecr get-login --no-include-email --region us-west-1)

* Build your Docker image using the following command. For information on building a Docker file from scratch see the instructions here . You can skip this step if your image is already built:

```bash
docker build -t decompany/pdf-converter .
```

## ECR 등록하기

* After the build completes, tag your image so you can push the image to this repository:
```bash
docker tag decompany/pdf-converter:latest 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
```

* Run the following command to push this image to your newly created AWS repository:

```bash
docker push 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
```