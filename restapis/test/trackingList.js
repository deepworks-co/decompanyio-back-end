'use strict';

// tests for trackingList
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('trackingList', '/controllers/tracking/list.js', 'handler');

describe('trackingList', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      queryStringParameters:{
        documentId: "6decc182c7d44dc7b80f08c55a78b81a"
      }
    }

    return wrapped.run(event).then((response) => {
      console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
