'use strict';

// tests for hourlyReadVote
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('generateFeatured', '/functions/cron/generateFeatured.js', 'handler');

describe('generateFeatured', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    return wrapped.run({}).then((response) => {
      expect(response).to.not.be.empty;
    });
  }).timeout(300000);
});
