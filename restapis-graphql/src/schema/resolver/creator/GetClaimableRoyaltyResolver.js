'use strict';

const {ClaimRoyalty, Document} = require('decompany-mongoose').models;
const {utils} = require('decompany-common-utils');
const { calcCreatorRoyalty } = require('./CreatorService')
module.exports = async ({documentId}) => {
    if (!documentId) {
        throw new Error("parameter is not valid")
    }

    const doc = await Document.findById({_id: documentId})
    const userId = doc.accountId

    const lastClaimDate = await getLastClaimDate(userId, documentId)

    const nowDate = new Date(utils.getBlockchainTimestamp(new Date()));
    const startDate = utils.getDate(new Date(utils.getBlockchainTimestamp(lastClaimDate)), 1);
    const endDate = utils.getDate(nowDate, 1);

    console.log(`${startDate} <= ... < ${endDate}`)
    return calcCreatorRoyalty({documentId, startDate, endDate})
}

const getLastClaimDate = async (userId, documentId) => {
    const lastClaim = await ClaimRoyalty.find({
        "_id.userId": userId,
        "_id.documentId": documentId,
    }).sort({_id: -1}).limit(1);
    lastClaim[0] ? dateAgo(lastClaim[0].created) : 0;

    if(!lastClaim[0])
        return new Date(0)

    if(isNaN(lastClaim[0]._id.blockchainTimestamp))
        return new Date(0)

    const lastDate = new Date(lastClaim[0]._id.blockchainTimestamp)

    return lastDate
}
