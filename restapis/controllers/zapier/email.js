'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.stringify(event));
  const wapper = new MongoWapper(mongodb.endpoint);
  const {documentId} = event.query;
  
  const start = Date.now() - (1000 * 60 * 60 * 24 * 50);// before 2days
  const emails = await wapper.distinct(tables.TRACKING, "e", {id: documentId, t:{$gt: start}});


  //const emails = ["jay@decompany.io", "jay.j.lee@infrawareglobal.com"];

  return JSON.stringify({
    ok: true,
    documentId: documentId,
    emails: emails
  });
};
