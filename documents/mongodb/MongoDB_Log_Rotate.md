# MongoDB Log Rotate

> https://docs.mongodb.com/manual/tutorial/rotate-log-files/

> https://linoxide.com/linux-how-to/setup-mongodb-log-rotation/

## Mongodb Conf

> RunCommand

```javascript
db.adminCommand( { logRotate : 1 } )
```

> /etc/mongodb.conf

```vi
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: rename
```


## rotate util

```bash
vi /etc/logrotate.d/mongodb

/var/log/mongodb/mongodb.log {
    daily
    rotate 30
    compress
    missingok
    sharedscripts
    postrotate
        	kill -SIGUSR1 $(cat /var/lib/mongo/mongod.lock)
    endscript
}
```


## The easiest way to perform log rotation is to manually execute

```bash
kill -SIGUSR1 $(cat /var/lib/mongo/mongod.lock)
```