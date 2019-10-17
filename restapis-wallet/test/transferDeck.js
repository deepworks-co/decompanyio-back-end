'use strict';

// tests for transferDeck
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('transferDeck', '/src/deck/transfer.js', 'handler');

describe('transferDeck', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      principalId: "google-oauth2|101778494068951192848",
      body: {
        to: "linkedin|HpIQ_mxN0N",
        deck: 0.1
      }
    }
    return wrapped.run(event).then((response) => {
      console.log(response)
      expect(response).to.not.be.empty;
    })
  }).timeout(60000);
});
