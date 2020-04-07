db = db.getSiblingDB("decompany")

function getBlockchainTimestamp(date){
  return date.getTime() - (date.getTime() % (1000 * 60 * 60 * 24));
}
function getDate(date, days) {
  const baseDate = new Date(date);
  return new Date(baseDate.setDate(baseDate.getDate() + days));
}

function saveCuratorRewardData({documentId, userId, baseDate, pageview, voteAmount}) {
  print('saveCuratorRewardData', {documentId, userId, baseDate, pageview, voteAmount})
  const blockchainTimestamp = getBlockchainTimestamp(baseDate);
  const blockchainDate = new Date(blockchainTimestamp)

  db.VOTE.save({documentId, userId, "deposit": NumberDecimal(voteAmount),"blockchainTimestamp": getBlockchainTimestamp(baseDate),"created": baseDate.getTime()})
  
  db["STAT-PAGEVIEW-DAILY"].save({_id: {
    year: baseDate.getUTCFullYear(), month: baseDate.getUTCMonth() + 1, dayOfMonth: baseDate.getUTCDate(), id: documentId
  }, blockchainDate, blockchainTimestamp, created: baseDate.getTime(), pageview: pageview, documentId})

  const totalPageview = pageview
  const totalPageviewSquare = Math.pow(pageview, 2)
  const count = 1 //한개의 문서(의미 없음, 기록용)
  db["STAT-PAGEVIEW-TOTALCOUNT-DAILY"].save({_id: {
    year: baseDate.getUTCFullYear(), month: baseDate.getUTCMonth() + 1, dayOfMonth: baseDate.getUTCDate()
  }, totalPageview, totalPageviewSquare, count, blockchainDate, blockchainTimestamp, created: baseDate.getTime()})
}

/**
 * 20일간 하나의 문서에 대해서 4.3 vote, 1 pageview의 테스트 데이터 생성
 */
const userId = "google-oauth2|101778494068951192848"
const documentId = "feed7f026db54859bec3221dcad47d8f";
const BEFORE_DAYS = 20;
const startDate = getDate(new Date(), (BEFORE_DAYS * -1));

// data input
for(let i=0;i<BEFORE_DAYS;i++){
  const nowDate = getDate(startDate, i);

  saveCuratorRewardData({
    documentId: documentId, 
    userId: userId,
    baseDate: nowDate,
    pageview: 1,
    voteAmount: "4000000000000000000"
  }); //4 deck

}