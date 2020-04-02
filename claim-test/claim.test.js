const json1 = require('./restapis-graphql.reward.json')
const json2 = require('./restapis-wallet.reward.json')


describe('compare', () => {
  beforeAll(() => {
    
  })

  describe('compare', () => {

        
    let data1 = json1.map((claims)=>{
        //console.log(JSON.stringify(claims))
        return claims
    })

    data1 = convertArrayInArray(data1);

    let data2 = convertArrayInArray(json2);

    const sortedData1 = data1.sort((a, b)=>{
        const voteDateA = new Date(a.voteDate)
        const voteDateB = new Date(b.voteDate)
        const activeDateA = new Date(a.activeDate)
        const activeDateB = new Date(b.activeDate)
        return (voteDateA.getTime()>voteDateB.getTime() 
            && activeDateA.getTime() > activeDateB.getTime())
    })

    const sortedData2 = data2.sort((a, b)=>{
        const voteDateA = new Date(a.voteDate)
        const voteDateB = new Date(b.voteDate)
        const activeDateA = new Date(a.activeDate)
        const activeDateB = new Date(b.activeDate)
        return (voteDateA.getTime()>voteDateB.getTime() 
            && activeDateA.getTime() > activeDateB.getTime())
    })
    
    //console.log("sortedData1", JSON.stringify(sortedData1));
    //console.log("sortedData2", JSON.stringify(sortedData2));

    sortedData1.forEach((item, idx)=>{
        const item2 = getItem(sortedData2, {voteDate: item.voteDate, activeDate: item.activeDate})

        if(!item2) {
            console.log('item1 ... item2 is null', JSON.stringify(item))
        }

        const title = `voteDate : ${item.voteDate}, activeDate : ${item.activeDate} : ${item.reward} = ${item2.value}`
        it(title, async () => {
            
            
            try{
                expect(item.reward).toBe(item2.value)
            } catch(err) {
                console.log(`item1 : ${JSON.stringify(item)}\r\nitem2 : ${JSON.stringify(item2)}`);
                throw err;
            }
            
            //expect(1).toBe(1)
        })
        
    })

  })

})

function convertArrayInArray(arrayInArray){
    return [].concat.apply([], arrayInArray);
}

function getItem(array, query) {
    
    return array.find((it)=>{
        return it.voteDate === query.voteDate && it.activeDate === query.activeDate
    })
}