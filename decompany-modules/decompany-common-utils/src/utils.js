const friendlyUrl = require('friendly-url')
const generate = require('nanoid/generate')
const BigNumber = require('bignumber.js');
const cookieUtil = require('cookie');
const camelcaseKeys = require('camelcase-keys');
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

exports.convertKeysToLowerCase = convertKeysToLowerCase = (obj) => {

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
  if(isNaN(royalty)){
    return 0
  }
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
  if(isNaN(reward)){
    return 0
  }
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
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
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
    // https://serverless.com/framework/docs/providers/aws/events/apigateway#example-lambda-proxy-event-default
    let cookie = eventParams.headers?eventParams.headers.cookie:null;
    cookie = cookie?cookieUtil.parse(cookie):null

    const headers = eventParams.headers?convertKeysToLowerCase(eventParams.headers):null
    const authorizer = eventParams.authorizer;
    return {
      method: eventParams.httpMethod,
      path: eventParams.path,
      params: eventParams.httpMethod === 'GET'? eventParams.queryStringParameters: eventParams.body,
      headers: headers,
      principalId: authorizer?authorizer.principalId: null,
      cookie: cookie
    }
  } else {
    // lambda event.method
    // https://serverless.com/framework/docs/providers/aws/events/apigateway#lambda-integration
    const headers = eventParams.headers?convertKeysToLowerCase(eventParams.headers):null
    return {
      method: eventParams.method,
      path: eventParams.requestPath,
      params: eventParams.method === 'GET'? eventParams.query: eventParams.body,
      headers: headers?headers:null,
      principalId: eventParams.principalId
    }
  }
}


/**
 * _cid, _sid, _tid를 생성한다.
 */
exports.generateTrackingIds = (cookies) =>{
  const getRandomId = ()=>{
      const id = generate('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-', 21) //=> "4f90d13a42"
      return `${id}.${Date.now()}`
  }

  let _cid = cookies?cookies['_cid']:null;
  let _sid = cookies?cookies['_sid']:null;
  let _tid = cookies?cookies['_tid']:null;

  if(!_cid) _cid = getRandomId()
  if(!_sid) _sid = getRandomId()
  if(!_tid) _tid = getRandomId()

  return {
    _cid,
    _sid,
    _tid,
  }
}
exports.makeTrackingCookie = (trackingIds, origin) => {
  let domain = origin?origin.replace(/(^\w+:|^)\/\//, ''):null;
  domain = domain.replace("www.", "");
  const secure = process.env.stage === 'local' || process.env.stage === 'localdev' ?false:true;
  
  const getExpiredAt = (second)=>{
    const expiredAt = new Date();
    expiredAt.setTime(expiredAt.getTime() + second * 1000)
    return expiredAt;
  }
  const hours24 = 1 * 24 * 60 * 60;// * 1000;
  const min30 = 30 * 60;// * 1000
  /**
   * API Gateway의 버그....
   * 다수의 Set-Cookies를 통하여 Expire가 다양한 키를 전달하려고 함
   * Set-Cookies라는 키를 3개를 보내지 못함(API Gateway가 지원안함, 중복된 키를 header에 못넣음... 아니면 좀 배열이라도...)
   * 다만 동일한 문자열을 대소문자를 잘 조절해주면 3개가(아래와 같이...) response에을 통하여 전달됨...(이게 말이됨???....)
   * express + eks기반으로 가야 할듯....
   */
  return {
    'Access-Control-Allow-Origin': origin,
    "set-Cookie": `_tid=${trackingIds._tid};expires=${getExpiredAt(hours24).toGMTString()};max-age=${hours24};path=/;domain=${domain};Secure;HttpOnly;`,
    "Set-cookie": `_cid=${trackingIds._cid};expires=${getExpiredAt(min30).toGMTString()};max-age=${min30};path=/;domain=${domain};Secure;HttpOnly;`,
    "set-cookie": `_sid=${trackingIds._sid};path=/;domain=${domain};Secure;HttpOnly;`
  }
}

exports.camelcaseKeys = (obj) =>{
  return camelcaseKeys(obj);
}