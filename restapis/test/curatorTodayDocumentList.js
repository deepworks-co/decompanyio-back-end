'use strict';

// tests for curatorTodayDocumentList
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('curatorTodayDocumentList', '/controllers/curator/curatorTodayDocumentList.js', 'handler');

describe('curatorTodayDocumentList', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      body: {
        pageNo: 1,
        accountId: "0xa4dA09DF8E5D0E05775c2C26ABCdFB97f3e84e15"
      }
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});