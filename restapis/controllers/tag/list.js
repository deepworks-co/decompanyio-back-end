'use strict';
const documentService = require('../document/documentMongoDB');
module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  const {t} = event.query;
  
  const resultList = await documentService.getTopTag(t);

  const response = JSON.stringify({
    success: true,
    resultList: resultList
  });

  return response;
};
