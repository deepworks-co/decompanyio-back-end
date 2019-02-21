# Redshift Query Example

## Create Table API Gateway Access Log

create table api_access_log (
  requestId varchar(50),
  ip varchar(20),
  userAgent varchar,
  requestTime varchar,
  requestTimeEpoch BIGINT,
  httpMethod varchar(10),
  resourcePath varchar,
  path varchar,
  responseLatency integer,
  status SMALLINT,
  protocol varchar(20),
  responseLength integer
)
compound sortkey(requestTimeEpoch)

## Create Table Tracking_log

create table tracking_log(
  id varchar,
  cid varchar,
  sid varchar,
  t BIGINT,
  created BIGINT,
  ev varchar,
  e varchar
)
compound sortkey(id, cid, sid, t)

## Query Example 01

select timestamp 'epoch' + requesttimeepoch * interval '0.001 second' as requesttime, useragent from public."api_access_log"

## Import Error Query

select * from pg_catalog."stl_load_errors"
order by starttime desc
limit 10;
