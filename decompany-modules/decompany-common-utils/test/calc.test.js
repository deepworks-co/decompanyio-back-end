const utils = require('../src/utils');

test('calcRoyalty test', () => {

    const r = utils.calcRoyalty({
        pageview: 1,
        totalPageview: 5,
        creatorDailyReward: 4.12345678901234567890
    });
    expect(r).toBe("0.824691357802469");
});


test('calcReward test', () => {

    const r = utils.calcReward({
        pageview: 1,
        totalPageviewSquare: 5,
        myVoteAmount: 1,
        totalVoteAmount: 3,
        curatorDailyReward: 5
    });
    expect(r).toBe("0.33333333333333333333");
});