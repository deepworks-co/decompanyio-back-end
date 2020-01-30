'use strict';

// tests for getBalance
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('getBalance', '/src/account/balance.js', 'handler');

describe('getBalance', () => {
  before((done) => {
    done();
  });

  after((done, fn) => {
    done();
    process.exit();
  });

  it('miner', () => {
    const event = {
      body: {userId: "miner"}
    }

    return wrapped.run(event).then((response) => {
      console.log(response)
      expect(response).to.not.be.empty;
    });
  });

  
 
  it('google-oauth2|101778494068951192848', () => {
 
    const event = {
      body: {userId: "google-oauth2|101778494068951192848"}
    }

    return wrapped.run(event).then((response) => {
      console.log(response)
      expect(response).to.not.be.empty;
    });
  });

  //delay(5000)

  it('google-oauth2|107070602776474268283', async () => {
    
    const event = {
      body: {userId: "google-oauth2|107070602776474268283"}
    }
   
    return wrapped.run(event).then((response) => {
      console.log(response)
      expect(response).to.not.be.empty;
    });
  });



});

function delay(interval) 
{
   return it('should delay', done => 
   {
      setTimeout(() => done(), interval)

   }).timeout(interval + 100) // The extra 100ms should guarantee the test will not fail due to exceeded timeout
}