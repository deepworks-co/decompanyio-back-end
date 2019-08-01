'use strict';

// tests for autoExpireDocument
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('autoCheckConvertFailDocument', '/src/document/autoCheckConvertFailDocument.js', 'handler');

describe('autoCheckConvertFailDocument', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    return wrapped.run({}).then((response) => {
      console.log(response);
      expect(response.result.ok === 1).to.be.true;
    });
  });
});
