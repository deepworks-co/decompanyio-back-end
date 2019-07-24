'use strict';
const https = require('https'); // Replace with http if necessary
const path = require('path');
const AWS = require("aws-sdk");


const envConfigs = {
    "default": {
        "frontendBucket": "share.decompany.io",
        "metaUrl": "https://api.share.decompany.io/rest/api/document/meta",
        "resHost": "https://thumb.share.decompany.io",
        "mainHost": "https://share.decompany.io",
        "titleSuffix": "Decompany"
        
    },
    "EDFUPNJU9XKGX": {
        "frontendBucket": "share.decompany.io",
        "metaUrl": "https://api.share.decompany.io/rest/api/document/meta",
        "resHost": "https://thumb.share.decompany.io",
        "mainHost": "https://share.decompany.io",
        "titleSuffix": "Decompany"
    },
    "E1UYELY2K59G6Q": {
        "frontendBucket": "www.polarishare.com",
        "metaUrl": "https://api.polarishare.com/rest/api/document/meta",
        "resHost": "https://res.polarishare.com",
        "mainHost": "https://www.polarishare.com",
        "seo" : true,
        "titleSuffix": "Polaris Share"
    }
    
}
let BUCKET = envConfigs.default.frontendBucket;
let META_URL = envConfigs.default.metaUrl;
let RES_HOST = envConfigs.default.resHost;
let MAIN_HOST = envConfigs.default.mainHost;

const INDEX = "index.html";

exports.handler = (event, context, callback) => {
    const { request, response, config } = event.Records[0].cf;
    console.log("request", JSON.stringify(request));
    
    if (path.extname(request.uri) === "") { // !.js !.css !.html !.jpg ...
        const envConfig = envConfigs[config.distributionId];
        if(envConfig){
            BUCKET = envConfig.frontendBucket;
            META_URL = envConfig.metaUrl;
            RES_HOST = envConfig.resHost;
            MAIN_HOST = envConfig.mainHost;
        } 
        
        console.log("request", `${request.uri}${request.querystring?'?'+request.querystirng:""}`);
        const seoTitle = request.uri.split("/")[2];
        const metaUrl = `${META_URL}?seoTitle=${seoTitle}`;
        const titleSuffix = envConfig.titleSuffix;
        console.log("metaUrl", metaUrl);
        Promise.all([fetchUrl(metaUrl), getIndexHtml()])
        .then((res)=>{
            
            const json = JSON.parse(res[0]);
            const {document} = json;
            let html = res[1];
            if(document){
                console.log(document);

                if(document.isDeleted === true || document.isBlock === true){
                    return buildResponse(html, 404, "Not Found")
                }

                /*
                const imagesMetaTag = Array.apply(null, {length: document.totalPages}).map((it, idx)=>{
                    const imageUrl = `${RES_HOST}/${document._id}/2048/${idx+1}`;
                    return `<meta property="og:image" content="${imageUrl}"><meta property="og:image:width" content="720"><meta property="og:image:height" content="498">`;
                }).join("");
                */

                const authorname = `${document.author.username?document.author.username:document.author.email}`;
                //const url = `${MAIN_HOST}/${authorname}/${document.seoTitle}`;
                const url = `${MAIN_HOST}${request.uri}`;
                const imageUrl = `${RES_HOST}/${document._id}/2048/1`;
                const regDate =  document.created;//(new Date(document.created)).toUTCString();
                
                let metaTag = `<title>${document.title} - ${authorname} - ${titleSuffix}</title>`;
                if(!envConfig.seo || document.isPublic === false){
                    metaTag += `<meta name="Robots" content="noindex, nofollow" />`
                }
                
                metaTag += `<meta content="2237550809844881" property="fb:app_id" name="fb_app_id" />
                <meta name="title" content="${document.title}" />
                <meta name="description" content="${document.desc}" />
                <meta name="author" content="${authorname}" />
                <meta name="keyworkds" content="${document.tags.join(",")}" />
                <meta property="og:url" content="${url}" />
                <meta property="og:site_name" content="Polaris Share" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="${document.title}" />
                <meta property="og:description" content="${document.desc}" />
                <meta property="og:image" content="${imageUrl}" /><meta property="og:image:width" content="720"><meta property="og:image:height" content="498" />
                <meta property="og:regDate" content="${regDate}" />               
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@Polarishare" />
                <meta name="twitter:title" content="${document.title}" />
                <meta name="twitter:description" content="${document.desc}" />
                <meta name="twitter:image" content="${imageUrl}" />
                <meta name="twitter:url" content="${url}" />
                `;

                html = html.replace("<title>Polaris Share</title>", metaTag);
                
                //console.log(html);
                return buildResponse(html)
                
            } else {
                return buildResponse(html, 404, "Not Found")
            }
            
        })
        .catch((err)=>{
            console.log("server side rendering error", err);
            //callback(null, );
            return buildResponse(err.errorMessage, 500, "Server Error");
        })
        .then((response)=>{
            callback(null, response);
        });
    } else {
        callback(null, request);
    }
    
    
};

function getIndexHtml(){
    return new Promise((resolve, reject)=>{
        const s3 = new AWS.S3({region: "us-west-1"});
        
        s3.getObject({
            "Bucket": BUCKET,
            "Key": INDEX
        }, function (err, data) {
            if(err) {
                reject(err);
            } else {
                const html = data.Body.toString("utf-8");
                resolve(html);
            }
        });
    })
}


function buildResponse(message, status, statusDescription){
    const response = {
        status: status?status:200,
        statusDescription: statusDescription?statusDescription:"HTTP OK",
        body: typeof(message) === 'string'? message: JSON.stringify(message)
    }
    return response;
}

// Build our own fetch
const fetchUrl = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, distant => {

            if(distant.statusCode === 404){
                let response = '';
                distant.on('data', packet => response += packet.toString());
                distant.on('end', () => resolve(JSON.stringify({error: response})));
            } else {
                let response = '';
                distant.on('data', packet => response += packet.toString());
                distant.on('end', () => resolve(response));
            }
            
        }).on('error', e => {
            reject(e);
        });
    });
};
