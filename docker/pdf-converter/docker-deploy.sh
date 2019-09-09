docker build -t decompany/pdf-converter .
$(aws ecr get-login --no-include-email --region us-west-1)
docker tag decompany/pdf-converter:latest 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest
docker push 197966029048.dkr.ecr.us-west-1.amazonaws.com/decompany/pdf-converter:latest