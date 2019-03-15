'use strict';

// tests for pageviewRequestPutOnChainByDaily
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('dailyPageview', '/functions/cron/dailyPageview.js', 'handler');

describe('dailyPageview', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {period: 60}
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  }).timeout(300000);
});
