/**
 * @description Date object를 Blockchain에 넣을 YYYY-MM-DD 00:00:00의 timestamp값으로 변경한다. 
 */
exports.getBlockchainTimestamp = (date) => {
  // daily YYYY-MM-DD 00:00:00(실행기준에서 전날 일자)
  //let yesterday = new Date(); /* 현재 */
  //yesterday.setDate(yesterday.getDate() - 1);

  /* 날짜 - 1일 */

  if(typeof(date) === 'string'){
    //yyyy-mm-dd string
    const yyyymmdd = toDate(date);
    const d = Math.floor(yyyymmdd / (60 * 60 *24 * 1000)) * (60 * 60 *24 * 1000);
    return d;
  } else if(typeof(date) === 'object'){
    //Date type
    const d = Math.floor(date / (60 * 60 *24 * 1000)) * (60 * 60 *24 * 1000);
    return d;
  } else {
    throw new Error('Unsupported datatype.' + typeof(date));
  }

  
  //console.log("getBlockchainTimestamp", d, new Date(d));
  return d;
}

function toDate(dateStr) {
  const [year, month, day] = dateStr.split("-")
  return new Date(year, month - 1, day)
}

exports.getNumber = (number, defaultNumber) => {
    return isNaN(parseInt(number, 10)) ? defaultNumber : parseInt(number, 10);
}
