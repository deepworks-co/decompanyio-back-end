'use strict';

// tests for documentUpdate
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('documentInfo', '/controllers/document/documentInfo.js', 'handler');

describe('documentInfo', () => {
  before((done) => {
    done();
  });

  it('Get Document Doc', () => {
    const event = {
      path: {
        //documentId: "dev-test-ovobik"
        documentId: "test-xaxg51"
      }
    }
    return wrapped.run(event).then((response) => {

      console.log("response", JSON.parse(response).featuredList);
      
      expect(response).to.not.be.empty;
    });
  });

  it('FAIL_CONVERT Doc', () => {
    const event = {
      path: {
        //documentId: "dev-test-c3nkml"
        documentId: "dev-test-kdhkfe"
      }
    }
    return wrapped.run(event).then((response) => {

      console.log("response");
      console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
