'use strict';

// tests for documentTrackingInfo
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('trackingInfo', '/controllers/tracking/info.js', 'handler');

describe('trackingInfo', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      /*query:{
        documentId: "3a328b4a0c8e4638b7c110ecb791bbce",
        cid: "1906096669.1559648098"
      }*/
      principalId: "google-oauth2|101778494068951192848",
      query: {
        documentId: 'feed7f026db54859bec3221dcad47d8f',
        cid: '9YfqnBPDL9elJZJzTrCox.1587021258606',
        include: true
      }
    }

    return wrapped.run(event).then((response) => {
      console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
