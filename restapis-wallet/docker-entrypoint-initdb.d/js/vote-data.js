db = db.getSiblingDB("decompany")

function getBlockchainTimestamp(date){
  return date.getTime() - (date.getTime() % (1000 * 60 * 60 * 24));
}
function getDate(date, days) {
  const baseDate = new Date(date);
  return new Date(baseDate.setDate(baseDate.getDate() + days));
}

function saveCuratorRewardData(baseDate, pageview) {
  const blockchainTimestamp = getBlockchainTimestamp(baseDate);
  const blockchainDate = new Date(blockchainTimestamp)

  db.VOTE.save({documentId, userId, "deposit": NumberDecimal("4300000000000000000"),"blockchainTimestamp": getBlockchainTimestamp(nowDate),"created": nowDate.getTime()})
  
  db["STAT-PAGEVIEW-DAILY"].save({_id: {
    year: baseDate.getUTCFullYear(), month: baseDate.getUTCMonth() + 1, dayOfMonth: baseDate.getUTCDate(), id: documentId
  }, blockchainDate, blockchainTimestamp, created: baseDate.getTime(), pageview: pageview, documentId})

  const totalPageview = pageview
  const totalPageviewSquare = Math.pow(pageview, 2)
  const count = 1
  db["STAT-PAGEVIEW-TOTALCOUNT-DAILY"].save({_id: {
    year: baseDate.getUTCFullYear(), month: baseDate.getUTCMonth() + 1, dayOfMonth: baseDate.getUTCDate()
  }, totalPageview, totalPageviewSquare, count, blockchainDate, blockchainTimestamp, created: baseDate.getTime()})
}
const userId = "google-oauth2|101778494068951192848"
const documentId = "feed7f026db54859bec3221dcad47d8f";
const BEFORE_DAYS = 20;
let nowDate = getDate(new Date(), (BEFORE_DAYS * -1));

for(let i=0;i<BEFORE_DAYS;i++){
  nowDate = getDate(nowDate, 1);
  saveCuratorRewardData(nowDate, 1);
}