docker run --rm --name local-mongo \
-v "$(pwd)"/docker-entrypoint-initdb.d:/docker-entrypoint-initdb.d \
-p 27017:27017 \
mongo:4.0