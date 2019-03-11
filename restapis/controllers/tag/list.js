'use strict';
const documentService = require('../documentMongoDB');
module.exports.handler = async (event, context, callback) => {


  const resultList = await documentService.getTopTag();

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      success: true,
      resultList: resultList
    }),
  };

  return (null, response);
};
