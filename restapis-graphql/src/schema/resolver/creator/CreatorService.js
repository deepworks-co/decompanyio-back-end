'use strict';

const { VWDailyPageview, RewardPool } = require('decompany-mongoose').models;
const {utils} = require('decompany-common-utils');

module.exports = {
    calcCreatorRoyalty
}


async function calcCreatorRoyalty({documentId, startDate, endDate}) {


    const start = utils.getBlockchainTimestamp(startDate);
    const end = utils.getBlockchainTimestamp(endDate);   

    const list = await VWDailyPageview.find({
        documentId: documentId,
        blockchainTimestamp: {$gte: start, $lt: end}
    }).sort({blockchainTimestamp: -1});
    const resultList = await calcRewardList(list);

    return resultList.map((it) => {

        return {
            documentId: it.documentId,
            userId: it.userId,
            activeDate: new Date(it.blockchainTimestamp),
            pageview: it.pageview,
            totalPageview: it.totalPageview,
            royalty: it.reward
        }

    })
};

const getRewardPool = (rewardPoolList, curDate) =>
    rewardPoolList.find(it => {
        const {start, end} = it._id;
        return start <= curDate && end > curDate;
    });

const calcRewardList = async list => {
    const rewardPoolList = await RewardPool.find({});

    return list.map(it => {
        const {year, month, dayOfMonth} = it._id;
        const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
        const rewardPool = getRewardPool(rewardPoolList, date);

        let reward = 0;
        if (rewardPool) {
            reward = utils.calcRoyalty({
                pageview: it.pageview,
                totalPageview: it.totalPageview,
                creatorDailyReward: rewardPool.creatorDailyReward
            });

        }


        return {
            documentId: it.documentId,
            pageview: it.pageview,
            totalPageview: it.totalPageview,
            reward: reward,
            blockchainTimestamp: it.blockchainTimestamp,
            blockchainDate: it.blockchainDate,
            userId: it.userId,
            creatorDailyReward: rewardPool && rewardPool.creatorDailyReward?rewardPool.creatorDailyReward:undefined
        };
    })
};
