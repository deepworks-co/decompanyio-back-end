'use strict';

// tests for dailyDownloadAggregate
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('dailyDownloadAggregate', '/functions/sf/dailyDownloadAggregate.js', 'handler');

describe('dailyDownloadAggregate', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    return wrapped.run({}).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});