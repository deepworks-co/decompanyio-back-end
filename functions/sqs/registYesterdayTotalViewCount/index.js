'use strict';
const AWS = require('aws-sdk');
AWS.config.update({
  region: "us-west-1",
});

const TABLE_NAME = "DEV-CA-CRONHIST-TOTALVIEWCOUNT";
const docClient = new AWS.DynamoDB.DocumentClient();

/*
* registYesterdayViewCount
*/
module.exports.handler = (event, context, callback) => {

  // smartcontract DocumentReg function confirmPageView(bytes32 _docId, uint _date, uint _pageView)
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

  const putItem = {
      TableName: TABLE_NAME,
      Item: {
        date: params.date,
        totalViewCount: params.totalViewCount,
        totalViewCountSquare: params.totalViewCountSquare,
        count: params.count,
        created:created
      },
      ReturnConsumedCapacity: "TOTAL"
  };

  docClient.put(putItem, (err, data) => {
    if(err){
      console.error("[ERROR Regist Yesterday Total View Count]", err);

      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: "done"
        })
      });
    } else {
      console.info("[SUCCESS Regist Yesterday Total View Count]", {params, data});
    }
  });

};
