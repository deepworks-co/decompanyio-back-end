const friendlyUrl = require('friendly-url')
const shortid = require('shortid');
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

exports.toSeoFriendly = (str) => {
  return friendlyUrl(str).concat("-", shortid.generate());
}
