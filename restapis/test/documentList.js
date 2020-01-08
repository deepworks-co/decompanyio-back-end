'use strict';

// tests for documentUpdate
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('documentList', '/controllers/document/documentController.js', 'list');

describe('documentList', () => {
  before((done) => {
    done();
  });

  it('implement tests here', () => {
    const event = {
      query: {
        path: "featured"
        //path: "popular"
      }
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });

  it('implement tests here', () => {
    const event = {
      query: {
        path: "popular"
      }
    }
    return wrapped.run(event).then((response) => {
      expect(response).to.not.be.empty;
    });
  });

  it('implement tests here', () => {
    const event = {
      query: {

      }
    }
    return wrapped.run(event).then((response) => {
      console.log("latest", response)
      expect(response).to.not.be.empty;
    });
  });
});
