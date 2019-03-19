'use strict';
const { mongodb, tables } = require('../../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils } = require('decompany-common-utils');
module.exports.handler = async (event, context, callback) => {
  console.log(JSON.parse(event));
  const wapper = new MongoWapper(mongodb.endpoint);
  const {documentId} = event.query;
  const emails = ["jay@decompany.io", "jay.j.lee@infrawareglobal.com"];

  return JSON.stringify({
    ok: true,
    documentId: documentId,
    emails: emails
  });
};
