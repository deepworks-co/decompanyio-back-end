# Create Certificate


## share.decompany.io

```bash

aws acm request-certificate --domain-name share.decompany.io \
--validation-method DNS \
--subject-alternative-names *.share.decompany.io \
--region ap-northeast-2
```


## polarishare.com

```bash

aws acm request-certificate --domain-name polarishare.com \
--validation-method DNS \
--subject-alternative-names *.polarishare.com \
--region ap-northeast-2
```