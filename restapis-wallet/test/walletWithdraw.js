'use strict';

// tests for walletWithdraw
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('walletWithdraw', '/src/wallet/withdraw.js', 'handler');

describe('walletWithdraw', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      principalId: "google-oauth2|101778494068951192848",
      body: {
        amount: 1,
        toAddress: "0xa05b51311397C5552798Ce216250BC0e757c1Aa2"
      }
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
