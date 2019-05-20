'use strict';
const documentService = require('../document/documentMongoDB');
const {utils} = require('decompany-common-utils');
const { applicationConfig, s3Config, region } = require('../../resources/config.js').APP_PROPERTIES();

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event : ", event.query);
  try{
    //console.log("context : ", context);
    let {documentId} =  event.query;

    if(!documentId){
      throw new Error("parameter is invaild!!");
    }

    let document = await documentService.getDocumentBySeoTitle(documentId);
    //console.log("get document by seo title", document);
    if(!document){
      return JSON.stringify({
        success: true,
        message: "document does not exist!",
      });
    }
    const author = document.author;
    let domain = applicationConfig.mainHost;
    if(domain.lastIndexOf("/")<0){
      domain += "/";
    }
    const username = author.username;
    const width = 640;
    const height = width * 9/16;
    const seoTitle = document.seoTitle;
    let contentsUrl = `${domain}/${username}/${seoTitle}`;
    contentsUrl = encodeURIComponent(contentsUrl);
    let authorUrl = domain + author.username;
    authorUrl = encodeURIComponent(authorUrl);
    const html = `<object width="${width}" height="${height}"><param name="rich" value="${contentsUrl}"></param><embed src="${domain}" type="application/x-shockwave-flash" width="${width}" height="${height}"></embed></object>`

    const response = JSON.stringify({
        version: "1.0",
        type: "rich",
        provider_name: "PolariShare",
        provider_url: domain,
        width: width,
        height: height,
        title: document.seoTitle,
        author_name: author.username,
        author_url: authorUrl,
        html: html
      }
    );

    console.log(response);
    return response;
  } catch(e) {
    console.error(e);
    throw e
  }
};