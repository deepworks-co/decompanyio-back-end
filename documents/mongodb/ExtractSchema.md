# Extract MongoDB Schema

## Git
https://github.com/perak/extract-mongo-schema

## Install 
npm -g install extract-mongo-schema

## Extract to HTML
extract-mongo-schema -d "mongodb://decompany:decompany1234@52.53.208.45:27017/decompany" -o schema.html -f html-diagram


## Extract to JSON
extract-mongo-schema -d "mongodb://decompany:decompany1234@52.53.208.45:27017/decompany" -o schema.json