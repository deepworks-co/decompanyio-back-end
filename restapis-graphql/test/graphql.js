'use strict';

// tests for qraphql
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('graphql', '/src/index.js', 'handler');

describe('graphql', () => {
  before((done) => {
    done();
  });

  it('GetTodayUserActiveVoteAmount', () => {

    const query = `{
      getDocument: Document {
        findById(_id: "feed7f026db54859bec3221dcad47d8f"){
          _id
          title
          seoTitle
          desc
          isPublic
        }	
      }
    }`
    
    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        query
      })

    }


    return wrapped.run(event).then((response) => {
      expect(response.statusCode).to.be.equal(200)
    });
  });


  it('addFavorite', () => {
    
    const query = `
      mutation {
        UserDocumentFavorite {
          addFavorite(documentId: "feed7f026db54859bec3221dcad47d8f") {
            _id
          }
        }
      }
    `
    
    const event = {
      httpMethod: "POST",
      principalId: "google-oauth2|101778494068951192848",
      body: JSON.stringify({
        query
      })

    }


    return wrapped.run(event).then((response) => {
      expect(response.statusCode).to.be.equal(200)
    });

  });

  it('getTodayActiveVoteAmount', () => {
    
    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        query: `{
          Curator {
            getTodayActiveVoteAmount(
              documentId:"feed7f026db54859bec3221dcad47d8f"){
              activeDate
              documentId
              voteAmount
            }
          }
        }`
      })
    }

    return wrapped.run(event).then((response) => {
      expect(response.statusCode).to.be.equal(200)
    });

    
  });

});
