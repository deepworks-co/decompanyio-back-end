'use strict';

// tests for accountDocuments
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('accountDocuments', '/controllers/account/documents.js', 'handler');

describe('accountDocuments', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {

    const event = {
      principalId: "google-oauth2|116434154009969203346",
      query: {pageNo: 1, pageSize: 100}
    }
    return wrapped.run(event).then((response) => {
      console.log("response")
      console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
