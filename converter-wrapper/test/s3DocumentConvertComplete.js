'use strict';

// tests for s3DocumentConvertComplete
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('s3DocumentConvertComplete', '/src/document/convertComplete.js', 'handler');


describe('s3DocumentConvertComplete', () => {
  before((done) => {
    done();
  });

  it('550cb188c51f458dafe8eb53318e26a2 result.json', async () => {
    
    const event = {
      "Records": [
        
        {
          "s3": {
            "bucket": {
              "name": "dev-ca-document",
            },
            "object": {
              "key": "THUMBNAIL/550cb188c51f458dafe8eb53318e26a2/result.json"
            }
          }
        }
        
      ]
    }

    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });

  }).timeout(300000);//5mins

  it('550cb188c51f458dafe8eb53318e26a2 1 page image', async () => {
    
    const event = {
      "Records": [
        {
          "s3": {
            "bucket": {
              "name": "dev-ca-document",
            },
            "object": {
              "key": "THUMBNAIL/550cb188c51f458dafe8eb53318e26a2/1200X1200/1"
            }
          }
        }   
      ]
    }
   
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });    
  });

  it('022f3acc6b05484cb787032c81fc304d 1 page image', async () => {
    
    const event = {
      "Records": [
        {
          "s3": {
            "bucket": {
              "name": "dev-ca-document",
            },
            "object": {
              "key": "THUMBNAIL/022f3acc6b05484cb787032c81fc304d/1200X1200/1"
            }
          }
        }   
      ]
    }
   
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });    
  });

});
