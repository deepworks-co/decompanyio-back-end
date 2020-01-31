'use strict';

// tests for qraphql
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('graphql', '/src/index.js', 'handler');

describe('CuratorSchemaTest', () => {
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
      const body = JSON.parse(response.body)
      const r = response.statusCode === 200 && !body.errors
      expect(r).to.be.equal(true)
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
      const body = JSON.parse(response.body)
      const r = response.statusCode === 200 && !body.errors
      expect(r).to.be.equal(true)
    });

    
  });


  it('determineCuratorReward', () => {
    
    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        query: `{
          Curator {
            determineCuratorReward(userId:"google-oauth2|101778494068951192848", documentId:"feed7f026db54859bec3221dcad47d8f"){
              voteDate
              activeDate
              userId
              documentId
              reward
            }
          }
        }`
      })
    }

    return wrapped.run(event).then((response) => {
      const body = JSON.parse(response.body)
      const r = response.statusCode === 200 && !body.errors
      expect(r).to.be.equal(true)
    });

    
  });

});