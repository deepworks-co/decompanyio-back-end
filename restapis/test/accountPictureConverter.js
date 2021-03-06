'use strict';

// tests for accountPictureConverter
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('accountPictureConverter', '/s3/account/accountPictureConverter.js', 'handler');

describe('accountPictureConverter', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {

    const event  = {
      Records: [
          {
            s3: {
                bucket: {
                    name: "dev-ca-upload-profile"
                },
                object: {
                    key: "google-oauth2%7C101778494068951192848/google-oauth2%7C101778494068951192848_1559120598089",
                    size: 4806
                }
            }            
          }, {
            s3: {
                bucket: {
                    name: "dev-ca-upload-profile"
                },
                object: {
                    key: "google-oauth2%7C101778494068951192848/google-oauth2%7C101778494068951192848_1559121407752",
                    size: 4806
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
