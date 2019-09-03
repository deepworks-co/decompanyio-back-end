# PDF Converter Image 생성하고 ECR에 등록하기

    ## PDF Converter 이미지 생성하기

        1) 기본 Runtime 이미지 생성(최초 한번만 실행, 이후 빌드 환경이 변하지 않으면 계속 사용됨)

            ```bash
            docker build --no-cache -f Dockerfile-base -t decompany/pdf-converter-base .
            ```

        2) Converter Application 이미지 생성 (decompany/pdf-converter-base 이미지 기반)

            ```bash
            docker build -t decompany/pdf-converter .
            ```

        3) Retrieve the login command to use to authenticate your Docker client to your registry.
        Use the AWS CLI:

            ```bash
            $(aws ecr get-login --no-include-email --region us-west-1)
            ```

    ## ECR 등록하기

        1) After the build completes, tag your image so you can push the image to this repository:

            ```bash
            docker tag decompany/pdf-converter:latest 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
            ```

        2) Run the following command to push this image to your newly created AWS repository:

            ```bash
            docker push 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
            ```

    ## Copy!!! & Run
    
        ```bash
        docker build -t decompany/pdf-converter .
        $(aws ecr get-login --no-include-email --region us-west-1)
        docker tag decompany/pdf-converter:latest 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
        docker push 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
        ```