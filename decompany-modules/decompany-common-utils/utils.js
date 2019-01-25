exports.getBlockchainTimestamp = (date) => {
  // daily YYYY-MM-DD 00:00:00(실행기준에서 전날 일자)
  //let yesterday = new Date(); /* 현재 */
  //yesterday.setDate(yesterday.getDate() - 1);

  /* 날짜 - 1일 */

  const d = Math.floor(date / (60 * 60 *24 * 1000)) * (60 * 60 *24 * 1000);
  //console.log("getBlockchainTimestamp", d, new Date(d));
  return d;
}

exports.getNumber = (number, defaultNumber) => {
    return isNaN(parseInt(number, 10)) ? defaultNumber : parseInt(number, 10);
}
