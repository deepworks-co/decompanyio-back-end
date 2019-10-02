'use strict';

// tests for s3DocumentConvertComplete
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('s3DocumentConvertComplete', '/src/document/convertComplete.js', 'handler');

const { mongodb, tables } = require('decompany-app-properties');
const { MongoWapper, utils } = require('decompany-common-utils');


describe('s3DocumentConvertComplete', () => {
  before((done) => {
    done();
  });

  it('1fb0012674b442de9bc4e397f6e8dd62 1page convert Test', async () => {
    
    const event = {
      "Records": [
        
        {
          "s3": {
            "bucket": {
              "name": "asem-ko-document",
            },
            "object": {
              "key": "THUMBNAIL/ce352d3873174318a780a72f9b0ed028/result.txt"
            }
          }
        }
        
      ]
    }

    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });

  }).timeout(300000);//5mins


  it('Test result.txt - 52c130ad55924521a16bb11b044e7f67 ', async () => {
    
    const event = {
      "Records": [
        {
          "s3": {
            "bucket": {
              "name": "asem-ko-document",
            },
            "object": {
              "key": "THUMBNAIL/98af37649f554903aa9837eff72b1aa0/result.txt"
            }
          }
        },
        {
          "s3": {
            "bucket": {
              "name": "asem-ko-document",
            },
            "object": {
              "key": "THUMBNAIL/98af37649f554903aa9837eff72b1aa0/1200X1200/1"
            }
          }
        }   
      ]
    }

    return wrapped.run(event).then((response) => {
      const result = response[0]
      const success = result && result.documentId !== undefined && result.shortUrl !== undefined && result.dimensions !== undefined;
      expect(success).to.be.true
    });    
  });
});