'use strict';

// tests for eventWithdraw
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('sqsWithdraw', '/src/sqs/withdraw.js', 'handler');

describe('sqsWithdraw', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
        "Records": [
            {
                "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
                "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
                "body": JSON.stringify({
                  "address" : "0x95eBC541197B3338D5403F09998Bb53a01c87E84",
                  "blockNumber" : 183642,
                  "transactionHash" : "0xfe4b9dabe9fc1b10bc790e8ee1356fc435c43b560e59b0a922daa91d8fe7ac37",
                  "transactionIndex" : 0,
                  "blockHash" : "0xe975c2d1a3b9fd034324386fe0d546bf1c5eb7b1fd9cdfc838144e0f98436260",
                  "logIndex" : 0,
                  "removed" : false,
                  "id" : "log_6162c10e",
                  "returnValues" : {
                    "0" : "0x4Ee128892469e7962e6E617727cb99C59525D7D2",
                    "1" : "0x07Ab267B6F70940f66EAf519b4a7c050496480D3",
                    "2" : "10000000000000000000",
                    "from" : "0x4Ee128892469e7962e6E617727cb99C59525D7D2",
                    "to" : "0x07Ab267B6F70940f66EAf519b4a7c050496480D3",
                    "value" : "10000000000000000000"
                  },
                  "event" : "Transfer",
                  "signature" : "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                  "raw" : {
                    "data" : "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
                    "topics" : [
                      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                      "0x0000000000000000000000004ee128892469e7962e6e617727cb99c59525d7d2",
                      "0x00000000000000000000000007ab267b6f70940f66eaf519b4a7c050496480d3"
                    ]
                  }
                })
            }, {
              "messageId": "059f36b4-87a3-44ab-83d2-661975830a7d",
              "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...",
              "body": JSON.stringify({
                "address" : "0x95eBC541197B3338D5403F09998Bb53a01c87E84",
                "blockNumber" : 183642,
                "transactionHash" : "0xfe4b9dabe9fc1b10bc790e8ee1356fc435c43b560e59b0a922daa91d8fe7ac37",
                "transactionIndex" : 0,
                "blockHash" : "0xe975c2d1a3b9fd034324386fe0d546bf1c5eb7b1fd9cdfc838144e0f98436260",
                "logIndex" : 0,
                "removed" : false,
                "id" : "log_6162c10e",
                "returnValues" : {
                  "0" : "0x4Ee128892469e7962e6E617727cb99C59525D7D2",
                  "1" : "0x07Ab267B6F70940f66EAf519b4a7c050496480D3",
                  "2" : "10000000000000000000",
                  "from" : "0x4Ee128892469e7962e6E617727cb99C59525D7D2",
                  "to" : "0x07Ab267B6F70940f66EAf519b4a7c050496480D3",
                  "value" : "10000000000000000000"
                },
                "event" : "Transfer",
                "signature" : "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "raw" : {
                  "data" : "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
                  "topics" : [
                    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                    "0x0000000000000000000000004ee128892469e7962e6e617727cb99c59525d7d2",
                    "0x00000000000000000000000007ab267b6f70940f66eaf519b4a7c050496480d3"
                  ]
                }
              })
          }
        ]
    }
    
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
