'use strict';

const {VWDailyPageview, RewardPool, ClaimRoyalty} = require('decompany-mongoose').models;
const {utils} = require('decompany-common-utils');

module.exports = async ({documentId, userId}) => {
    if (!userId || !documentId) {
        throw new Error("parameter is not valid")
    }

    const lastClaim = await ClaimRoyalty.find({
        "_id.userId": userId,
        "_id.documentId": documentId,
    }).sort({_id: -1}).limit(1);

    const LAST_CLAIM_DAYS = lastClaim[0] ? dateAgo(lastClaim[0].created) : 0;

    const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
    const startDate = utils.getDate(nowDate, -1 * (LAST_CLAIM_DAYS - 1));
    const endDate = utils.getDate(nowDate, 1);

    const start = utils.getBlockchainTimestamp(startDate);
    const end = utils.getBlockchainTimestamp(endDate);

    /*console.log("documentId : '" + documentId + "'");
    console.log("userId : '" + userId + "'");
    console.log("lastClaim : '" + lastClaim + "'");
    console.log("LAST_CLAIM_DAYS : ", LAST_CLAIM_DAYS);
    console.log("start : ", start);
    console.log("end : ", end);*/

    const list = await VWDailyPageview.find({
        userId: userId,
        documentId: documentId,
        blockchainTimestamp: {$gte: start, $lt: end}
    }).sort({blockchainTimestamp: -1});
    const resultList = await calcRewardList(list);

    return resultList.map((it) => {

        return {
            documentId: it.documentId,
            userId: userId,
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

        let reward = -1;
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
            userId: it.userId
        };
    })
};

const dateAgo = timestamp => {
    let currentDate = Number(new Date());
    let lastDate = Number(new Date(timestamp));
    return Math.floor((currentDate - lastDate) / (60 * 60 * 24 * 1000));
};