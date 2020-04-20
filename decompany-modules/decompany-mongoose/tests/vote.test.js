const {connectToDB,  mongoDBStatus, models} = require('../')//require('./mongoose');
const {VOTE} = models

describe('vote', () => {
  describe('vote', () => {
    beforeAll(() => {
        connectToDB('mongodb://localhost:27017/test')
    })
     
     
    let savedVote = null;
    it('vote save', async () => {
        const vote = new Vote({
            documentId: "doc_11",
            userId: "userId_111",
            deposit: "10000000000000000000000000000000000000000000000000",
            blockchainTimestamp: Date.now(),
            created: Date.now()
        });
        savedVote = await vote.save()
        console.log(savedVote)
        expect(savedVote.toJSON()._id !== undefined).toBe(true)
    })

    it('findById vote', async () => {
       
        const result = await Vote.findById({_id: savedVote._id})
        console.log(result)
        expect(JSON.stringify(savedVote.toJSON())).toBe(JSON.stringify(result.toJSON()))
    })
  })
    
})
