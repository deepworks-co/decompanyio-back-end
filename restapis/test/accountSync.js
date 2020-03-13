'use strict';

// tests for accountSync
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('accountSync', '/controllers/account/sync.js', 'handler');

describe('accountSync', () => {
  before((done) => {
    done();
  });

  it('sync - jay@decompany.io', () => {
    const event = {
      principalId: "google-oauth2|101778494068951192848",
      body: {
        "sub":"google-oauth2|101778494068951192848",
        "given_name":"Jay",
        "family_name":"Lee",
        "nickname":"jay",
        "name":"Jay Lee",
        "picture":"https://lh5.googleusercontent.com/-XFDbx4F4BCE/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3reBKkzgLiQu2RzziAptt5cYePEgSg/mo/photo.jpg",
        "locale":"ko",
        "updated_at":"2019-06-10T05:24:05.175Z",
        "email":"jay@decompany.io",
        "email_verified":true
      }
    }
    return wrapped.run(event).then((response) => {
      //console.log("response");
      //console.log(response);
      expect(response).to.not.be.empty;
    });
  });

  it('sync - worn29@gmail.com', () => {
    const event = {
      principalId: "google-oauth2|101778494068951192848",
      body: {
        "sub":"google-oauth2|112098078580108061874",
        "given_name":"재구",
        "family_name":"이",
        "nickname":"재구",
        "name":"이재구",
        "picture":"https://lh4.googleusercontent.com/-lEaJSdhCVLA/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rdWCRHPUaVqdyKrGVV45XnwDfx6eA/mo/photo.jpg",
        "locale":"ko",
        "email":"worn29@gmail.com"
      }
    }
    return wrapped.run(event).then((response) => {
      //console.log("response");
      //console.log(response);
      expect(response).to.not.be.empty;
    });
  });
});
