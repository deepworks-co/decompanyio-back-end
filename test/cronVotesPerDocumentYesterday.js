'use strict';

// Generated by serverless-mocha-plugin
// TODO: sls invoke test
// TODO: sls invoke test [--stage stage] [--region region] [-f function1] [-f function2] [...]
console.log("current path", __dirname, process.cwd());
const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('cronVotesPerDocumentYesterday', '/functions/sqs/cronVotesPerDocumentYesterday/index.js', 'handler');

describe('SmartContractToDynamoVotesPerDocumentYesterday', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    //ae5bb91da55142f1b6aa038c04266c8c, 40cca9f5e8f34449bdaebe7516d9bdd7
    const records = [
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
      JSON.stringify({
        "accountId": "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15",
        "documentId": "292d1a61262f45acb1ac161f5e5a541e"
      }),
    ];

    const event = {
      Records: records
    }


    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
