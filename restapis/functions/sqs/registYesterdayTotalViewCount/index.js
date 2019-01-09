'use strict';
const MongoWapper = require('../libs/mongo/MongoWapper.js');
const connectionString = 'mongodb://decompany:decompany1234@localhost:27017/decompany';

const TABLE_NAME = "DEV-CA-CRONHIST-TOTALVIEWCOUNT";


/*
* registYesterdayViewCount
*/
module.exports.handler = async (event, context, callback) => {

  // smartcontract DocumentReg function confirmPageView(bytes32 _docId, uint _date, uint _pageView)
  try{
    console.log("event", event.Records[0].body);
    const params = JSON.parse(event.Records[0].body);

    if(isNaN(params.date)) {
      console.log({message: "Invaild Parameter", params: params});
      return callback(null, {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          message: "Invaild Parameter",
          params: params
        })
      });
    }

    // Increment an atomic counter
    const created = Date.now();//timestamp
    const wapper = new MongoWapper(connectionString);
    
    const doc = {
      date: params.date,
      totalViewCount: params.totalViewCount,
      totalViewCountSquare: params.totalViewCountSquare,
      count: params.count,
      created:created
    }

    await wapper.save(TABLE_NAME, doc);

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: "done"
      })
    });

  } catch(e){
    console.error("registYesterdayTotalViewCount", e);
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: e
      })
    });
  }
};
