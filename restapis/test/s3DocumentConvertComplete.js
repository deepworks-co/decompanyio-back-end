'use strict';

// tests for s3DocumentConvertComplete
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('s3DocumentConvertComplete', '/s3/document/convertComplete.js', 'handler');

describe('s3DocumentConvertComplete', () => {
  before((done) => {
    done();
  });

  const event = {
    "Records": [
      {
        "s3": {
          "bucket": {
            "name": "dev-ca-document",
          },
          "object": {
            "key": "THUMBNAIL/b2177c45fa0e4f0c95ccdc59ac03ea9d/result.txt"
          }
        }
      }
    ]
  }

  it('implement tests here', () => {
    return wrapped.run(event).then((response) => {
      console.log("test result", response);
      expect(response).to.not.be.empty;
    });
  });
});
