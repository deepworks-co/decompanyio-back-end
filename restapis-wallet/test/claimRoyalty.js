'use strict';

// tests for claimRoyalty
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('claimRoyalty', '/src/claim/royalty.js', 'handler');

describe('claimRoyalty', () => {
  before((done) => {
    done();
  });
  after((done, fn) => {
    done();
    process.exit();
  });
  it('implement tests here', () => {
    const event = {
      principalId: "google-oauth2|101778494068951192848",
      body: {
        documentId: "feed7f026db54859bec3221dcad47d8f"
      }
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
