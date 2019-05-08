'use strict';
const { region, mongodb, tables, sitemapConfig } = require('../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils, s3 } = require('decompany-common-utils');
const sitemapGenerater = require('sitemap');
const zlib = require('zlib');
const limit = 10;
const wapper = new MongoWapper(mongodb.endpoint);
module.exports.handler = async (event, context, callback) => {
  
  try{

    const count = await getCount(tables.DOCUMENT, {state: "CONVERT_COMPLETE"});

    const theLoop = Array(parseInt(count / limit) + 1).fill(0);

    console.log("totalCount", count, theLoop);

    const promises = theLoop.map(async (it, skip)=> {

      return generateSitemap(limit, skip, `sitemap${skip}.xml.gz`);

    });

    const r = await Promise.all(promises);
    console.log("complete", r);
  } catch (e){
    console.error(e);
    throw e;
  } finally{
    wapper.close();
  }

  return "success";
  
};

async function generateSitemap(limit, skip, filename){
  const queryPipeline = getQueryPipeline(limit, skip);

  const resultList = await wapper.aggregate(tables.DOCUMENT, queryPipeline);
  console.log(`search count : ${resultList.length}`);
  //console.log(resultList.slice(5));
  const domain = sitemapConfig.domain;
  const bucket = sitemapConfig.bucket;

  const now = (new Date()).toUTCString();
  const urls = resultList.map((it)=>{
    const prefix = it.author.username?it.author.username:it.author.email;
    const url = `${domain}/${prefix}/${it.seoTitle}/`;
    return {
      url : url,
      changefreq: "never",
      lastmod: now
    }
  })

  const xml = await toXML({domain, urls});
  //console.log(xml)
  const compressedXml = await compress(xml)
  console.log(compressedXml);
  return await s3.putObject(bucket, filename, compressedXml, {
    /*ContentType: "application/x-gzip",
    ContentEncoding: "gzip",
    ContentDisposition: `attachment; filename="${filename}"`*/
  }, region);
}


function getQueryPipeline(limit, skip){
  return [
    {
      $match: {
        state: "CONVERT_COMPLETE"
      }
    }, {
      $sort: {
        created: 1
      }
    }, {
      $lookup: {
        from: tables.USER,
        localField: "accountId",
        foreignField: "_id",
        as: "userAs"
      }
    }, {
      $addFields: {
        author: { $arrayElemAt: [ "$userAs", 0 ] },
      }
    }, {
      $skip: skip
    }, {
      $limit: limit
    }
  ]
}

async function getCount(collectionName, query){
  const result = await wapper.count(collectionName, query);

  return result;
}
async function toXML(params) {
  const {domain, urls} = params;
  
  return new Promise((resolve, reject)=>{
    const sitemap = sitemapGenerater.createSitemap ({
      hostname: domain,
      cacheTime: 600000,        // 600 sec - cache purge period
      urls: urls
    });


    sitemap.toXML(async (err, xml)=>{
      if(err){
        reject(err);
      } else {
        resolve(xml);
      }
      
    })
  })
  
}

async function compress(xml) {
 
  
  return new Promise((resolve, reject)=>{
    zlib.gzip(xml, (err, result)=>{
      if(err){
        reject(err);
      } else {
        resolve(result);
      }
    })
  })
  
}