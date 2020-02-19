'use strict';
const { mongodb, tables, s3Config, applicationConfig, shortUrlConfig, region, constants } = require('decompany-app-properties');
const { MongoWapper } = require('decompany-common-utils');
const sizeOf = require('buffer-image-size');
const request = require('request');
const sharp = require("sharp");
var AWS = require("aws-sdk");

const s3 = new AWS.S3({
  region: region
});

const TABLE_NAME = tables.DOCUMENT;

const QUALITY = 95;

exports.handler = async (event, context, callback) => {
  /** Immediate response for WarmUp plugin */
  
  let results;
  try{
    //THUMBNAIL/05593afb-6748-47df-af76-6803e7f86378/1200X1200/1, 2, 3, 4,5 max page number
    const promises = event.Records.map((record) =>  {
      console.log("record", record);
      const key = record.s3.object.key;
      const bucket = record.s3.bucket.name;
      
      const keys = key.split("/");
      const prefix = keys[0];
      const documentId = keys[1];
      const surfix = keys[2];
      
      return run({
        key: key,
        bucket: bucket,
        prefix: prefix,
        documentId: documentId,
        surfix: surfix
      });
    });

    results = await Promise.all(promises);
    console.log(results)
  } catch(err){
    console.log(err);
    results = err;
  }

  
  return JSON.stringify(results)
};

function run(params){

  const {key, prefix, bucket, surfix, documentId} = params;
  return new Promise((resolve, reject)=>{
    if("result.json" === surfix){
      getDocument(documentId)
      .then((document)=>{

        if(!document || !document._id){
          reject("documet is not exist, " + documentId);
        }

        return Promise.resolve(document);
        
      })
      .then(async (document)=>{
        let shortUrl;
        if(shortUrlConfig){
          shortUrl = await getShortUrl(document);
          console.log("shortUrl", shortUrl);
        } else {
          console.log("shortUrlConfig is undefined");
        }
        return Promise.resolve({
          document: document,
          shortUrl: shortUrl
        })
      })
      .then((data)=>{
        //console.log("getDocSize argument", data);
        return getDocSize(data);
      })
      .then(async (data)=>{
        //console.log("convertComplete", data);
        const {document, shortUrl, dimensions} = data;
        const result = await convertComplete(bucket, key, document, shortUrl, dimensions);
        return resolve(result);
      })
      .catch((err)=>{
        //console.log(document);
        reject(err);
        
      })
    } else if("1200X1200" === surfix) {
      convertThumbnail(bucket, key)
      .then((data)=>{
        console.log("convertThumbnail success", data);
        resolve(data)
      })
      .catch((err)=>{
        console.log("convertThumbnail fail", err);
        reject(err);
      })
    } else {
      resolve({message: "not support", params});
    }
  });
}

function getDocSize(documentWithShortUrl){
  const { document, shortUrl } = documentWithShortUrl;
  const bucket = s3Config.document;
  const prefix = `THUMBNAIL/${document._id}/1200X1200/1`;
  return new Promise((resolve, reject)=>{
    s3.getObject({Bucket: bucket, Key: prefix}, function (err, data) {
      if(err){
        console.log("error get s3object for Document Size", err);
        return resolve(documentWithShortUrl);

      } else {
        const dimensions = sizeOf(data.Body);
        documentWithShortUrl.dimensions = dimensions;
        //console.log("get dimensions", dimensions, documentWithShortUrl);
        return resolve(documentWithShortUrl);
      }
    });
  });
}

function convertThumbnail(bucket, key){
  const keys = key.split("/");

  return new Promise(async (resolve, reject)=>{
      const r = await changeImageMetadata(bucket, key);
      console.log("changeImageMetadata", r)
      const type = keys[0]; //THUMBNAIL
      const documentId = keys[1]; // ${documentId}
      const sizeType = keys[2]; //1200X1200, 300X300
      const imagename = keys[3];  // 1, 2, 3
      const sizes = ['thumb', 1024, 640, 320, 2048];
      const promises = sizes.map((size)=>{
        const toProfix = "thumb/" + documentId + "/" + size + "/" + imagename;
        return convertJpeg({fromBucket: bucket, fromPrefix: key}, {toBucket: s3Config.thumbnail, toPrefix: toProfix}, size);
      });

      Promise.all(promises).then((data)=>{
        resolve(data);
      })
      .catch((err)=>{
        reject(err);
      })
  })
}
function changeImageMetadata(bucket, key){
  return new Promise((resolve, reject) => {
    s3.copyObject({
      Bucket: bucket,
      Key: key,
      CopySource: bucket + "/" + key,
      ContentType: "image/png",
      MetadataDirective: 'REPLACE'
    }, function(err, data){
      if(err) reject(err);
      else resolve(data);
    });
  })

}

async function convertComplete(bucket, key, document, shortUrl, dimensions){
  const documentId = document._id;
  //console.log(bucket, key, document);
  const {totalPages} = await getTotalPages(bucket, key);
  console.log("documentId", documentId, "totalPages", totalPages);

  return new Promise(async (resolve, reject) => {
         
      if(totalPages>0 && documentId) {
        const result = await updateConvertCompleteDocument(documentId, totalPages, shortUrl, dimensions);
        console.log("Update SUCCESS CONVERT_COMPLETE", result);
        return resolve(result);
      } else {
        reject(new Error("convert complete error"))
      }

  });

}

function getTotalPages(bucket, key){

  return new Promise((resolve, reject)=>{

    return s3.getObject({
        Bucket: bucket,
        Key: key
    }, function (err, data){
      
      if(err){
        reject(err);
      } else {
        let totalPages = -1;
        if(data){
          totalPages = JSON.parse(data.Body.toString('ascii')).totalPages;
          totalPages *= 1;
          resolve({totalPages});
        }
      }
      
    })

    
  });
  
}

async function getDocument(documentId){
  
  //throw new Error("error getDocument() : " + documentId);
  const wapper = new MongoWapper(mongodb.endpoint);
  try{
    const doc = await wapper.aggregate(TABLE_NAME, [{
      $match: {_id: documentId}
    }, {
      $lookup: {
        from: 'USER',
        localField: 'accountId',
        foreignField: '_id',
        as: 'author'
      }
    }, {
      $unwind: {
        path: "$author",
        preserveNullAndEmptyArrays: true
      }
    }]);
    return doc[0];
  } catch(ex){
    console.log(ex);
  }finally{
    wapper.close();
  }

}

async function updateConvertCompleteDocument(documentId, totalPages, shortUrl, dimensions){
  const wapper = new MongoWapper(mongodb.endpoint);
  
  try{
    const {STATE} = constants.DOCUMENT;
    const endPageNo = Number(totalPages);
    const updateDoc = {};
    updateDoc.state = STATE.CONVERT_COMPLETE;
    updateDoc.singlePageDoc = endPageNo===1?true:false;
    updateDoc.totalPages = Number(totalPages);
    if(shortUrl) updateDoc.shortUrl = shortUrl;
    if(dimensions) updateDoc.dimensions = dimensions;
    
    //console.log("updateConvertCompleteDocument updateDoc", updateDoc);
    const r = await wapper.update(TABLE_NAME, {_id: documentId}, {$set: updateDoc});
    console.log("updateResult", r, updateDoc);
    return {documentId, totalPages, shortUrl, dimensions}
    
  } catch(ex) {
    console.log(ex);
  } finally{
    wapper.close();
  }
  

}


async function convertJpeg(from, to, size){
  const {fromBucket, fromPrefix} = from;
  const {toBucket, toPrefix} = to;
  console.log({from, to});

  const input = await getS3ObjectBody(fromBucket, fromPrefix);
  const dimensions = sizeOf(input);
  //console.log(size, "dimensions", dimensions); 
  let calcsize;
  let new_size = {};
  let output
  if(typeof size === 'number'){
    calcsize = size;
    output = await sharp(input)
    .resize(calcsize, calcsize, {
      fit: sharp.fit.inside,
      withoutEnlargement: true
    })
    .jpeg({
      quality: QUALITY
    })
    .toBuffer();

  } else {
    console.log("slice", toPrefix.slice(-8));
    if(toPrefix.slice(-8) === "/thumb/1"){
      if(dimensions.width > dimensions.height){
        const ratio = 240 / dimensions.height;
        new_size.width = parseInt(dimensions.width * ratio);
        new_size.height = parseInt(dimensions.height * ratio);
  
        calcsize = new_size.width;
      } else {
        const ratio = 320 / dimensions.width;
        new_size.width = parseInt(dimensions.width * ratio);
        new_size.height = parseInt(dimensions.height * ratio);
  
        calcsize = new_size.height;
      }
      
      const extractSize= {left: (new_size.width/2 - 160), top: (new_size.height/2 - 120), width: 320, height: 239};
      //const extractSize= {left: 0, top: 0, width: 100, height: 100};
      console.log("thumb", "calcsize", calcsize, "new_size", new_size, "extractSize", extractSize);
      output = await sharp(input)
      .resize(new_size.width, new_size.height, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .jpeg({
        quality: QUALITY
      })
      //.extract(extractSize)
      .toBuffer();
    } else {
      return await Promise.resolve(true);
    }
  }

  console.log(size, dimensions, new_size, calcsize);

  return await putS3Object(toBucket, toPrefix, output, "image/jpeg");
}


function getS3ObjectBody(bucket, key){
  
  return new Promise((resolve, reject)=>{
    s3.getObject({
      Bucket: bucket, 
      Key: key
     }, function(err, data) {
       if (err) reject(err); // an error occurred
       else {
         resolve(data.Body);           // successful response
       }
  
     });
  })
  
}

function putS3Object(bucket, key, body, contentType){
  return new Promise((resolve, reject)=>{
    s3.putObject({
      Body: body, 
      Bucket: bucket, 
      Key: key, 
      CacheControl: "max-age=31536000",
      ContentType: contentType
     }, function(err, data) {
       if (err) {
         reject(err); // an error occurred
       } else {
          console.log("putS3Object success", bucket, key);
          resolve(data);           // successful response
       }
  
     });
  })
  
}

async function getShortUrl(document){
  
  const author = document.author;
  
  return new Promise((resolve, reject)=>{

    if(!shortUrlConfig && !shortUrlConfig.generatorUrl){
      reject(new Error("shortUrlConfig is undefined!"));
    }

    if(!applicationConfig.embedHost){
      reject(new Error("applicationConfig.embedHost is undefined!"));
    } 
    
    let host = applicationConfig.shortUrlHost;
    
    if(host.slice(-1) !== "/"){
      host += "/";
    }
    const url = `${host}${document.seoTitle}`;
    console.log("shortUrlConfig.generatorUrl", shortUrlConfig.generatorUrl);
    request.post({url : shortUrlConfig.generatorUrl, headers: {"Content-Type": "application/json"}, body: JSON.stringify({url: url})}, function (error, response, body){
      if(error){
        console.log("error", error);
        resolve(null);
      }else {
        const parsedBody = typeof(body)==='string'?JSON.parse(body):body;
        //console.log(response.statusCode, response.statusMessage);
        if(response.statusCode===200){
          if(parsedBody.url){
            resolve(parsedBody.url);
          } else {
            //reject("short url create fail", body);
            console.log("short url create fail", body);
            resolve(null);
          }
          
        } else {
          //reject(new Error(`Error ${response.statusCode} ${response.statusMessage} shortUrl create fail`));
          console.log(`Error ${response.statusCode} ${response.statusMessage} shortUrl create fail`)
          resolve(null);
        }
        
      }
    })
    
  }) 
  
}