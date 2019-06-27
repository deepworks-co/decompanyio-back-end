'use strict';

// tests for embededDocument
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('embededDocument', '/controllers/embeded/embededDocument.js', 'handler');

describe('embededDocument', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      query: {
        documentId: "decompany-introduction-e4g43q"
      }
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
