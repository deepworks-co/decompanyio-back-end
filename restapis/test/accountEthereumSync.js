'use strict';

// tests for accountEthereumSync
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('accountEthereumSync', '/controllers/account/accountEthereumSync.js', 'handler');

describe('accountEthereumSync', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      principalId: "google-oauth2|116434154009969203346",
      body: {
        ethAccount: "0x4add6551af429c71eB64e0494BC5E88334E94948"
      }
    }
    return wrapped.run(event).then((response) => {
      console.log(response)
      expect(response).to.not.be.empty;
    });
  });
});
