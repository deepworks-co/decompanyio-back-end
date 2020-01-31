'use strict';

// tests for calculateRoyalty
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('calculateRoyalty', '/functions/cron/calculateRoyalty.js', 'handler');

describe('calculateRoyalty', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      year: 2019, month: 11, dayOfMonth: 12
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });
});