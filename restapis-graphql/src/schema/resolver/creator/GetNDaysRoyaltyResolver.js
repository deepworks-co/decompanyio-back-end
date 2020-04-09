'use strict';

const {utils} = require('decompany-common-utils');
const { calcCreatorRoyalty } = require('./CreatorService')
module.exports = async ({documentId, days}) => {
    if (isNaN(days) || !documentId) {
        throw new Error("parameter is not valid")
    }

    const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
    const startDate = utils.getDate(nowDate, -1 * days);
    const endDate = utils.getDate(nowDate, 1);
    console.log(`${startDate} <= ... < ${endDate}`)
    return calcCreatorRoyalty({documentId, startDate, endDate})
};
