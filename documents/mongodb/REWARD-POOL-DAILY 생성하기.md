
```javascript
db.getCollection("REWARD-POOL").find({})
   .projection({})
   .sort({_id:1})
   .limit(10).forEach((it)=>{
       const start = it._id.start
       const end = it._id.end
       const creatorDailyReward = it.creatorDailyReward;
       const curatorDailyReward = it.curatorDailyReward;
       
        let loop = start;
        
        while(loop<end){
            
            db.getCollection("REWARD-POOL-DAILY").save({
                _id: loop.getTime(),
                blockchainDate: loop,
                creatorDailyReward,
                curatorDailyReward,
            })
            
            var newDate = loop.setDate(loop.getDate() + 1);
            loop = new Date(newDate)
            
        }
        
   })
   
   
   
```