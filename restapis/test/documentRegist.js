'use strict';

// tests for documentTracking
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('documentRegist', '/controllers/document/documentRegist.js', 'handler');

describe('documentRegist', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      principalId: "google-oauth2|101778494068951192848",
      body: {
        filename: "dev_test.pdf",
        size: "0",
        tags: ["test", "dev"],
        title: "dev_test",
        desc: "dev test",
        useTracking: true,
        forceTracking: true,
        isDownload: true
      }
    }
    return wrapped.run(event).then((response) => {
      console.log("");
      console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
