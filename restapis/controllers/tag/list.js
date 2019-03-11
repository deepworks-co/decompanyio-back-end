'use strict';
const documentService = require('../documentMongoDB');
module.exports.handler = async (event, context, callback) => {


  const resultList = await documentService.getTopTag();

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      resultList: resultList
    }),
  };

  return (null, response);
};
