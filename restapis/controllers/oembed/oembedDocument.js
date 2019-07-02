'use strict';
const urlParser = require('url');
const documentService = require('../document/documentMongoDB');
const {utils} = require('decompany-common-utils');
const { applicationConfig, s3Config, region, oembedConfig } = require('decompany-app-properties');

module.exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  if (event.source === 'lambda-warmup') {
    console.log('WarmUp - Lambda is warm!')
    return callback(null, 'Lambda is warm!')
  }

  console.log("event : ", event.query);
  try{
    //console.log("context : ", context);
    let {url} =  event.query;

    if(!url){
      throw new Error("parameter is invaild!!");
    }
    url = decodeURIComponent(url);
    const parsedUrl = urlParser.parse(url)
    console.log("parsedUrl", parsedUrl);

    const paramSeoTitle = parsedUrl.path.substring(1);
    let document = await documentService.getDocumentBySeoTitle(paramSeoTitle);
    const documentId = document._id;
    console.log("get document by seo title", document);
    if(!document){
      return JSON.stringify({
        success: true,
        message: "document does not exist!",
      });
    }
    const author = document.author;
    let domain = applicationConfig.mainHost;
    if(domain.slice(-1)!=="/"){
      domain += "/";
    }
    const username = author.username;
    const width = 640;
    const height = width * 9/16;
    const title = document.title;
    const seoTitle = document.seoTitle;
    let contentsUrl = `${domain + encodeURIComponent(username)}/${seoTitle}`;
    let authorUrl = `${domain + encodeURIComponent(author.username)}`;
    const ssrUrl = oembedConfig.host.slice(-1) === "/"?`${oembedConfig.host}${seoTitle}`:`${oembedConfig.host}/${seoTitle}`;
    
    const thumbnailUrl = getThumbnailUrl(documentId, width);

    console.log("ssrUrl", ssrUrl);
    const html = `<iframe src="${ssrUrl}" width="${width}" height="${height}" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="border:1px solid #CCC; border-width:1px; margin-bottom:5px; max-width: 100%;" allowfullscreen> 
    </iframe> 
    <div style="margin-bottom:5px"> 
      <strong> 
        <a href="${contentsUrl}" title=${title} target="_blank">${title}</a> 
      </strong> 
      from 
      <strong>
        <a href="${authorUrl}" target="_blank">${username}</a>
      </strong> 
    </div>`

    const response = JSON.stringify({
        version: "1.0",
        type: "rich",
        provider_name: "Polaris Share",
        provider_url: domain,
        width: width,
        height: height,
        title: document.seoTitle,
        author_name: author.username,
        author_url: authorUrl,
        html: html,
        thumbnail_url: thumbnailUrl,
	      thumbnail_height: height,
	      thumbnail_width: width
      }
    );

    return response;
  } catch(e) {
    console.error(e);
    throw e
  }
};

function getThumbnailUrl(documentId, size){
  let host = oembedConfig.thumbHost.slice(-1)==="/"?oembedConfig.thumbHost:oembedConfig.thumbHost + "/";
  host += documentId + "/";
  host += size + "/1";
  return host;
}