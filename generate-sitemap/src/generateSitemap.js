'use strict';
const { region, mongodb, tables, sitemapConfig } = require('decompany-app-properties');
const { MongoWapper, utils, s3, cloudfront } = require('decompany-common-utils');
const sitemapGenerater = require('sitemap');
const zlib = require('zlib');
const THUMBNAIL_SIZE = 2048;

module.exports.handler = async (event, context, callback) => {

  const wapper = new MongoWapper(mongodb.endpoint);
  const {domain, bucket} = sitemapConfig;
  try{
    
    const lastSitemapInfo = await getLastSitemapTimestamp(wapper);
    console.log(lastSitemapInfo.start);
    
    const lastTimestamp = lastSitemapInfo&& lastSitemapInfo.start>0?lastSitemapInfo.start:0;
    console.log(lastTimestamp, new Date(lastTimestamp), lastTimestamp);
    const start = utils.getBlockchainTimestamp(lastTimestamp);
    const end = utils.getBlockchainTimestamp(lastTimestamp) + 1000* 60 * 60 * 24;

    console.log(start, new Date(start), "~", end, new Date(end));
    const createdSitemapDoc = await generateSitemap(wapper, start, end);
    console.log("generateSitemap complete", createdSitemapDoc);
    if(createdSitemapDoc){

      const sitemaps = await getSitemap(wapper);
      console.log("getSitemap", sitemaps);

      const r2 = await generateSitemapIndex(sitemapConfig, sitemaps);
      console.log("generateSitemapIndex complete", r2);

      //const r3 = await invalidation(sitemapConfig, r2.Items);
      //console.log("createInvalidation", JSON.stringify(r3));
     

    } else {
      console.log("No sitemap created.");
    }  

  } catch (e){
    console.error(e);
    throw e;
  } finally{
    wapper.close();
  }

  return "success";
  
};


async function invalidation(sitemapConfig, items){
  const r3 = await cloudfront.createInvalidation(region, {
    DistributionId: sitemapConfig.distributionId, 
    InvalidationBatch: { 
      CallerReference: `T${Date.now()}`, 
      Paths: { 
        Quantity: items.length, 
        Items: ["/sitemap*"]
      }
    }
  });
  return r3;
}

function getLastSitemapTimestamp(wapper){

  return new Promise(async (resolve, reject)=>{
    
    const sitemaps = await getSitemap(wapper);
    console.log("already registry sitemaps", JSON.stringify(sitemaps));
    const last = sitemaps[sitemaps.length-1];
    console.log("last", last);
    let start = last && last.timestamp?last.timestamp:0;
    console.log("query start", start);

    if(start === 0){
      const doc = await getFirstDocument(wapper);
      start = doc.created;
    } else {
      start += 1000 * 60 * 60 * 24;
    }

    resolve({start});

  });
}

async function generateSitemapIndex(sitemapConfig, sitemaps){
  const {domain, bucket} = sitemapConfig
  const items = sitemaps.map((it)=>{
    return `/${it.filename}`;
  })

  items.push("/sitemap.xml");

  const now = new Date();
  const urls = sitemaps.map((it)=>{
    return `${domain}/${it.filename}`;
  });

  const xml = sitemapGenerater.buildSitemapIndex({
    urls: urls,
    lastmod: now.toISOString()
  });
  
  console.log("sitemap index", xml);
  const uploadResult = await s3.putObject(bucket, "sitemap.xml", xml, "application/xml", region);
  console.log("uploadSitemapIndex", uploadResult);
  return {
    Items: items
  }
}


async function generateSitemap(wapper, start, end){

  const startDate = new Date(start);


  const filename = `sitemap-${startDate.toISOString().substring(0, 10)}.xml`;
  const queryPipeline = getQueryPipeline(start, end);

  console.log("generateSitemap query", JSON.stringify(queryPipeline));
  const resultList = await wapper.aggregate(tables.DOCUMENT, queryPipeline);
  console.log(`search count : ${resultList.length}`);
  //console.log(resultList.slice(5));

  /*if(resultList.length===0){
    return;
  }*/
  
  const {domain, bucket} = sitemapConfig;

  const now = new Date();
  const promises = resultList.map(async (it)=> {
    const prefix = it.author.username?it.author.username:it.author.email;
    const url = `${domain}/${prefix}/${it.seoTitle}`;
    //https://thumb.share.decompany.io/b7e1baf131a24e3cb9bc152c4b98a670/320/21
    const documentId = it._id;
    const totalPages = it.totalPages;
    const title = it.title;
    const tags = it.tags;

    return {
      url : url,
      lastmod: [now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate()].join('-')
    }
  });//end resultList.map()

  const urls = await Promise.all(promises);
  //console.log("urls", JSON.stringify(urls));
  const xml = await makeSitemapXML({domain, urls});
  //console.log(xml)
  
  //xml document의 byte구하기
  const stringByteLength = (function(s,b,i,c){
    for(b=i=0;c=s.charCodeAt(i++);b+=c>>11?3:c>>7?2:1);
    return b
  })(xml);
  
  //const compressedXml = await compress(xml)
  //console.log(compressedXml);
  const uploadResult = await s3.putObject(bucket, filename, xml, {
    ContentType: "application/xml"
  }, region);

  const last = resultList[resultList.length-1];

  const result = {
    bucket: bucket,
    filename: filename,
    timestamp: last?last.created:start,
    filesize: stringByteLength,
    count: resultList.length
  };
  console.log(result);
  await saveSitemap(wapper, result);
  return result;
}


function getQueryPipeline(start, end){
  return [
    {
      $match: {
        state: "CONVERT_COMPLETE",
        isDeleted: false, isPublic: true, isBlocked: false, 
        created: {$gte: start, $lt: end}
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
    }
  ]
}

async function getSitemap(wapper){
  const result = await wapper.findAll(tables.SITEMAP, {}, {created: 1});

  return result;
}

async function getFirstDocument(wapper){
  return new Promise((resolve, reject)=>{

    wapper.query(tables.DOCUMENT, { state: "CONVERT_COMPLETE", isDeleted: false, isPublic: true, isBlocked: false})
    .sort({created: 1})
    .limit(1)
    .toArray((err, data)=>{
      if(err) reject(err)
      else {
        console.log(data);
        resolve(data[0]);
      }
    });
    

  });
  
}

async function saveSitemap(wapper, sitemap){

  const params = Object.assign({
    _id: sitemap.filename,
    created: Date.now()
  }, sitemap);
  
  await wapper.save(tables.SITEMAP , params);

  return true;  
}

async function getCount(collectionName, query){
  const result = await wapper.count(collectionName, query);

  return result;
}
async function makeSitemapXML(params) {
  const {domain, urls} = params;
  
  return new Promise((resolve, reject)=>{
    const sitemap = sitemapGenerater.createSitemap ({
      hostname: domain,
      cacheTime: 600000,        // 600 sec - cache purge period
      urls: urls
    });

    sitemap.toXML((err, xml)=>{
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

async function getDocumentTextById(bucket, region, documentId){

  const textBuffer = await s3.getObject(bucket, 'THUMBNAIL/' + documentId + '/text.json', region);
  return JSON.parse(textBuffer.Body.toString("utf-8"));

}

async function updateSitemap(){
  
  const r = await wapper.update(tables.SITEMAP , {}, {_id: -1}, 1);
  if(r[0]){
    return r[0].last;  
  }
  
}