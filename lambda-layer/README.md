# lambda layer

## build(using docker)

```bash
docker run --rm \
-v `pwd`:/`pwd` -w `pwd` \
-v $HOME/.aws/credentials:/root/.aws/credentials:ro \
-it node:10 /bin/bash

npm i -g serverless
npm install
npm run deploy:dev

```
