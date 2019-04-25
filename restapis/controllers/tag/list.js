'use strict';
const documentService = require('../document/documentMongoDB');
module.exports.handler = async (event, context, callback) => {

  const resultList = await documentService.getTopTag();

  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return response;
};
