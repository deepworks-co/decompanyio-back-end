const friendlyUrl = require('friendly-url')
const generate = require('nanoid/generate')
const BigNumber = require('bignumber.js');
/**
 * @description Date object를 Blockchain에 넣을 YYYY-MM-DD 00:00:00의 timestamp값으로 변경한다. 
 */
exports.getBlockchainTimestamp = (date) => {
  // daily YYYY-MM-DD 00:00:00(실행기준에서 전날 일자)
  //let yesterday = new Date(); /* 현재 */
  //yesterday.setDate(yesterday.getDate() - 1);

  
  let convertedDate = null;
  if(typeof(date) === 'string'){
    //yyyy-mm-dd string
    convertedDate = toUTCDate(date);    
  } else if(typeof(date) === 'object'){
    //Date type
    convertedDate = date;
  } else if(typeof(date) === 'number') {
    convertedDate = new Date(date);
  } else {
    throw new Error('Unsupported datatype.' + typeof(date));
  }
  
  const timestamp = convertedDate.getTime() - (convertedDate.getTime() % (1000 * 60 * 60 * 24));

  return timestamp;
}

function toUTCDate(dateStr) {
  const [year, month, day] = dateStr.split("-")
  return new Date(Date.UTC(year, month - 1, day));
}

exports.getNumber = (number, defaultNumber) => {
    return isNaN(parseInt(number, 10)) ? defaultNumber : parseInt(number, 10);
}

/**
 * @params : {alphabet: 'abcdefg...1234ABCD...', size: 10}
 */
exports.randomId = (params) => {

  if(params){
    return generate(params.alphabet, params.size)
  }
  
  return generate('0123456789abcdefghijklmnopqrstuvwxyz', 6);

}

exports.toSeoFriendly = (str, defaultTitle) => {
  if(!str)
    return;

  const id = generate('0123456789abcdefghijklmnopqrstuvwxyz', 6);
  let url = friendlyUrl(str);
  if(!url){
    url = defaultTitle?defaultTitle:str+"";
  }
  return url.concat("-", id);
}

exports.isLocal = () => {
  return process.env.stage === 'local'
}

exports.validateEmail = (email) => {
  //General Email Regex (RFC 5322 Official Standard)
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(email).toLowerCase());
}


exports.parseBool = (v, defaultValue) =>{
  
  if(v === undefined){
    if(defaultValue === true || defaultValue === 'true'){
      return true;
    } 
  } else if(typeof(v) === 'boolean'){
    return v;
  } else if(typeof(v) === 'string'){
    if(v===true || v==='true'){
      return true;
    }
  }

  return false;
}

exports.convertKeysToLowerCase = (obj) => {
  const output = {};
  for (i in obj) {
      if (Object.prototype.toString.apply(obj[i]) === '[object Object]') {
         output[i.toLowerCase()] = ConvertKeysToLowerCase(obj[i]);
      }else if(Object.prototype.toString.apply(obj[i]) === '[object Array]'){
          output[i.toLowerCase()]=[];
           output[i.toLowerCase()].push(ConvertKeysToLowerCase(obj[i][0]));
      } else {
          output[i.toLowerCase()] = obj[i];
      }
  }
  return output;
};

/**
 * @param totalPageview
 * @param pageview
 * @param creatorDailyReward
 */
exports.calcRoyalty = ({totalPageview, pageview, creatorDailyReward}) => {
  
  if(isNaN(totalPageview) || isNaN(pageview) || isNaN(creatorDailyReward)){
    
    throw new Error(`parameter is invalid in calcRoyalty  : ${JSON.stringify({totalPageview, pageview, creatorDailyReward})}`)
  }
  let royalty = new BigNumber(pageview).div(new BigNumber(totalPageview)).multipliedBy(new BigNumber(creatorDailyReward));
  //let royalty = (pageview / totalPageview)  * creatorDailyReward;
  //royalty  = Math.floor(royalty * 100000) / 100000;

  return royalty.toFixed(5, 1)
  
}


/**
 * 
 */
exports.calcReward = ({pageview, totalPageviewSquare, myVoteAmount, totalVoteAmount, curatorDailyReward}) => {
  
  if(isNaN(pageview) || isNaN(totalPageviewSquare) || isNaN(myVoteAmount) || isNaN(totalVoteAmount) || isNaN(curatorDailyReward)){
    throw new Error(`parameter is invalid in calcReward  : ${JSON.stringify({pageview, totalPageviewSquare, myVoteAmount, totalVoteAmount, curatorDailyReward})}`)
  }

  // let reward = ((Math.pow(pageview, 2) / totalPageviewSquare)) * ( myVoteAmount / totalVoteAmount ) * curatorDailyReward;
  // reward  = Math.floor(reward * 100000) / 100000;
  const pageViewPoint = new BigNumber(pageview).exponentiatedBy(2).div(new BigNumber(totalPageviewSquare))  

  const votePoint = BigNumber(myVoteAmount).div(new BigNumber(totalVoteAmount))

  const reward = pageViewPoint.multipliedBy(votePoint).multipliedBy(new BigNumber(curatorDailyReward))
  
  return reward.toFixed(5, 1);
}

/**
 * 
 * @param {Date} date 
 * @param {number} days 
 */
exports.getDate = (date, days) => {
  const baseDate = new Date(date);
  return new Date(baseDate.setDate(baseDate.getDate() + days));
}

exports.makeResponse = (body, addheader) => {
  return {
    statusCode: 200,
    headers: Object.assign({
      'Access-Control-Allow-Origin': 'https://share.decompany.io', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      'Content-Type': 'application/json'
    }, addheader),
    body: typeof body === 'string'?body:JSON.stringify(body)
  }
}

exports.makeErrorResponse = (err, addheader) => {
  return {
    statusCode: 500,
    headers: Object.assign({
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      'Content-Type': 'application/json'
    }, addheader),
    body: err && typeof err === 'string'?err:err.toString()
  }
}

exports.parseLambdaEvent = (eventParams) => {
  
  if(eventParams.httpMethod){
    // lambda-proxy integration
    return {
      params: eventParams.httpMethod === 'GET'? eventParams.queryStringParameters: eventParams.body,
      headers: eventParams.headers,
      principalId: eventParams.principalId
    }
  } else {
    // lambda event.method
    return {
      params: eventParams.method === 'GET'? eventParams.query: eventParams.body,
      headers: eventParams.headers,
      principalId: eventParams.principalId
    }
  }
}