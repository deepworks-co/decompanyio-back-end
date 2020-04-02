const {utils} = require('decompany-common-utils')

describe('calc', () => {
  beforeAll(() => {
    
  })

  describe('reward', () => {


    it('calc reward 1', async () => {
      const data = { 
        userId: 'google-oauth2|101778494068951192848',
        documentId: 'feed7f026db54859bec3221dcad47d8f',
        voteDate: new Date('2020-03-28T00:00:00.000Z'),
        blockchainDate: new Date('2020-04-01T00:00:00.000Z'),
        blockchainTimestamp: 1585699200000,
        pageview: 0,
        totalPageviewSquare: 0,
        myVoteAmount: '4.3',
        totalVoteAmount: '25.8',
        curatorDailyReward: 491803.2786885246,
        reward: 'NaN' 
      }
  
      const reward = utils.calcReward(data)
      console.log('reward', isNaN(reward))
      expect(reward).toBe(0)
    });

    it('calc reward 2', async () => {
      const data = { 
        userId: 'google-oauth2|101778494068951192848',
        documentId: 'feed7f026db54859bec3221dcad47d8f',
        voteDate: new Date('2020-03-27T00:00:00.000Z'),
        blockchainDate: new Date('2020-03-28T00:00:00.000Z'),
        blockchainTimestamp: 1585353600000,
        pageview: 1,
        totalPageviewSquare: 1,
        myVoteAmount: '4.3',
        totalVoteAmount: '30.1',
        curatorDailyReward: 491803.2786885246,
        reward: '70257.61124' 
      }
  
      const reward = utils.calcReward(data)
      console.log('reward', isNaN(reward))
      expect(reward).toBe(data.reward)
    });

  })

})
