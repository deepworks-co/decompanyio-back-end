'use strict';
const { region, mongodb, tables, sitemapConfig } = require('../resources/config.js').APP_PROPERTIES();
const { MongoWapper, utils, s3, cloudfront } = require('decompany-common-utils');
const sitemapGenerater = require('sitemap');
const zlib = require('zlib');

const wapper = new MongoWapper(mongodb.endpoint);
module.exports.handler = async (event, context, callback) => {
  
  try{
    const sitemaps = await getSitemap();
    console.log(JSON.stringify(sitemaps));
    const last = sitemaps[sitemaps.length-1];
    console.log("last", last);
    const start = last && last.timestamp?last.timestamp:0;
    const index = last && last.index>-1?(last.index + 1):0;
    console.log("query start", start, "index", index);
    
    const r = await generateSitemap(sitemapConfig.limit, start, index);
    console.log("generateSitemap complete", r);
    if(r){

      const newSitemaps = await getSitemap();

      const r2 = await generateSitemapIndex(newSitemaps);
      console.log("generateSitemapIndex complete", r2);

      const items = newSitemaps.map((it)=>{
        return `/${it.filename}`;
      })

      items.push("/sitemap.xml");
 
      const r3 = await cloudfront.createInvalidation(region, {
        DistributionId: sitemapConfig.distributionId, 
        InvalidationBatch: { 
          CallerReference: `T${Date.now()}`, 
          Paths: { 
            Quantity: items.length, 
            Items: items
          }
        }
      });
      console.log("createInvalidation", JSON.stringify(r3));
     

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

async function generateSitemapIndex(sitemaps){
  const {domain, bucket} = sitemapConfig;
 
  const urls = sitemaps.map((it)=>{
    return `${domain}/${it.filename}`;
  });

  const xml = sitemapGenerater.buildSitemapIndex({
    urls: urls
  });
  
  console.log("sitemap index", xml);
  const uploadResult = await s3.putObject(bucket, "sitemap.xml", xml, "application/xml", region);

  return true;  
}

async function generateSitemap(limit, start, index){
  const filename = `sitemap${index}.xml.gz`
  const queryPipeline = getQueryPipeline(limit, start);

  const resultList = await wapper.aggregate(tables.DOCUMENT, queryPipeline);
  console.log(`search count : ${resultList.length}`);
  //console.log(resultList.slice(5));

  if(resultList.length===0){
    return;
  }
  
  const {domain, image, bucket, documentBucket} = sitemapConfig;

  const now = new Date();
  const promises = resultList.map(async (it)=> {
    const prefix = it.author.username?it.author.username:it.author.email;
    const url = `${domain}/${prefix}/${it.seoTitle}/`;
    //https://thumb.share.decompany.io/b7e1baf131a24e3cb9bc152c4b98a670/320/21
    const documentId = it._id;
    const totalPages = it.totalPages;
    const title = it.title;
    const tags = it.tags;

    const texts = await getDocumentTextById(documentBucket, region, documentId);

    const images = Array(totalPages).fill(0).map((it, index)=>{
      return {
        url: `${image}/${documentId}/320/${index+1}`,
        title: title,
        caption: texts[index].substring(0, 200)
      }
    })


    return {
      url : url,
      changefreq: "never",
      lastmod: [now.getUTCFullYear(), now.getUTCMonth()+1, now.getUTCDate()].join('-'),
      img: images
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
  
  const compressedXml = await compress(xml)
  //console.log(compressedXml);
  const uploadResult = await s3.putObject(bucket, filename, compressedXml, {
    /*ContentType: "application/x-gzip",
    ContentEncoding: "gzip",
    ContentDisposition: `attachment; filename="${filename}"`*/
  }, region);

  const last = resultList[resultList.length-1];

  const result = {
    bucket: bucket,
    filename: filename,
    timestamp: last.created,
    filesize: stringByteLength,
    count: resultList.length,
    index: index
  };
  await saveSitemap(result);
  return result;
}


function getQueryPipeline(limit, start){
  return [
    {
      $match: {
        state: "CONVERT_COMPLETE",
        created: {$gt: start}
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
      $limit: limit
    }
  ]
}

async function getSitemap(){
  const result = await wapper.find(tables.SITEMAP, {});

  return result;
}

async function saveSitemap(sitemap){

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