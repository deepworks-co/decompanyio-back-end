const friendlyUrl = require('friendly-url')
const generate = require('nanoid/generate')
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

exports.randomId = () => {
  
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