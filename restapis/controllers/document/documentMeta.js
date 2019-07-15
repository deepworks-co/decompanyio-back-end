'use strict';
const documentService = require('./documentMongoDB');

module.exports.handler = async (event, context, callback) => {

  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }
  const {query} = event;
  console.log("event : ", event);

    
  let seoTitle = query.seoTitle;
  
  if(!seoTitle){
    throw new Error("parameter is invaild!!");
  }

  const document = await documentService.getDocumentBySeoTitle(seoTitle);
  console.log("get document by seo title", document);
  if(!document || document.isDeleted === true){
    return JSON.stringify({
      success: true,
      message: "document does not exist!",
    });
  }

  const response = JSON.stringify({
      success: true,
      document: document
    }
  );

  return (null, response);

}
