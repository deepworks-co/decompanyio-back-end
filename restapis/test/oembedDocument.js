'use strict';

// tests for embededDocument
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('oembedDocument', '/controllers/oembed/oembedDocument.js', 'handler');

describe('oembedDocument', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      query: {
        url: encodeURIComponent("https://share.decompany.io/jayjayjay/ethereum-yellowpaper-3xlv2m")
      }
    }
    return wrapped.run(event).then((response) => {
      console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
