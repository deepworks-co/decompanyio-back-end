# restapis-search
> Google Custom Search Engine을 이용하여 SEO된 문서 검색을 제공한다.




## Test

```
sls create function -f customSearch --handler src/google/customSearch.handler --httpEvent "get /api/custom/search"
```

## Redis docker run
```
docker run --rm -p 6379:6379 redis 
```