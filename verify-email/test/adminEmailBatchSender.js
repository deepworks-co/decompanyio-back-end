'use strict';

// tests for adminEmailBatchSender
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('adminEmailBatchSender', '/src/email/adminEmailBatchSender.js', 'handler');

describe('adminEmailBatchSender', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    return wrapped.run({}).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});
