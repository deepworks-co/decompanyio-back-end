#!/bin/sh
mongoimport --db=decompany --collection=USER --type=json --file=/docker-entrypoint-initdb.d/json/USER.json
mongoimport --db=decompany --collection=DOCUMENT --type=json --file=/docker-entrypoint-initdb.d/json/DOCUMENT.json
mongoimport --db=decompany --collection=REWARD-POOL-DAILY --type=json --file=/docker-entrypoint-initdb.d/json/REWARD-POOL-DAILY.json
mongoimport --db=decompany --collection=REWARD-POOL --type=json --file=/docker-entrypoint-initdb.d/json/REWARD-POOL.json
mongoimport --db=decompany --collection=DOCUMENT-FEATURED --type=json --file=/docker-entrypoint-initdb.d/json/DOCUMENT-FEATURED.json
mongoimport --db=decompany --collection=DOCUMENT-POPULAR --type=json --file=/docker-entrypoint-initdb.d/json/DOCUMENT-POPULAR.json
#mongoimport --db=decompany --collection=STAT-PAGEVIEW-DAILY --type=json --file=/docker-entrypoint-initdb.d/json/STAT-PAGEVIEW-DAILY.json
#mongoimport --db=decompany --collection=STAT-PAGEVIEW-TOTALCOUNT-DAILY --type=json --file=/docker-entrypoint-initdb.d/json/STAT-PAGEVIEW-TOTALCOUNT-DAILY.json
#mongoimport --db=decompany --collection=VOTE --type=json --file=/docker-entrypoint-initdb.d/json/VOTE.json

# Insert Test Data
mongo /docker-entrypoint-initdb.d/js/vote-data.js

# Create View
mongo /docker-entrypoint-initdb.d/js/vw-daily-pageview.js
mongo /docker-entrypoint-initdb.d/js/vw-daily-vote.js