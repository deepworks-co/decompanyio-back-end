'use strict';

// tests for IndexLambda
// Generated by serverless-mocha-plugin

const mochaPlugin = require('serverless-mocha-plugin');
const expect = mochaPlugin.chai.expect;
let wrapped = mochaPlugin.getWrapper('IndexLambda', '/src/indexLambda.js', 'handler');

describe('IndexLambda', () => {
  before((done) => {
    done();
  });

  it('/dean123/global-logistics-network-powerpoint-templates1-ss78i3 200 http status', () => {

    const event = {
      "Records": [
        {
          "cf": {
            "config": {
              "distributionId": "default"
            },
            "request": {
              "uri": "/dean123/global-logistics-network-powerpoint-templates1-ss78i3"
            }
          }
        }
      ]
    }
    return wrapped.run(event).then((response) => {
      //console.log(response);
      //expect(response).to.not.be.empty;
      console.log("response status", response.status );
      expect(response.status).to.equal(200);
    });
  });

  it('/nothing/asf 404 status', () => {

    const event = {
      "Records": [
        {
          "cf": {
            "config": {
              "distributionId": "default"
            },
            "request": {
              "uri": "/nothing/asf"
            }
          }
        }
      ]
    }
    return wrapped.run(event).then((response) => {
      console.log("response status", response.status );
      //expect(response).to.not.be.empty;
      expect(response.status).to.equal(404);

    });
  });


  it('404 deleted document', () => {

    const event = {
      "Records": [
        {
          "cf": {
            "config": {
              "distributionId": "default"
            },
            "request": {
              "uri": "/jayjayjay/ethereum-yellowpaper-m8okia"
            }
          }
        }
      ]
    }
    return wrapped.run(event).then((response) => {
      //console.log(response);
      //expect(response).to.not.be.empty;
      console.log("response status", response.status );
      expect(response.status).to.equal(404);
    });
  });

  it('no document url', () => {

    const event = {
      "Records": [
        {
          "cf": {
            "config": {
              "distributionId": "default"
            },
            "request": {
              "uri": "/jayjayjay"
            }
          }
        }
      ]
    }
    return wrapped.run(event).then((response) => {
      //console.log(response);
      //expect(response).to.not.be.empty;
      //console.log("response status", response.status );
      expect(response.status).to.equal(200);
    });
  });

  it('/callback', () => {

    const event = {
      "Records": [
        {
          "cf": {
            "config": {
              "distributionId": "default"
            },
            "request": {
              "uri": "/callback"
            }
          }
        }
      ]
    }
    return wrapped.run(event).then((response) => {
      //console.log(response);
      //expect(response).to.not.be.empty;
      //console.log("response status", response.status );
      expect(response.status).to.equal(200);
    });
  });

  it('/featured', () => {

    const event = {
      "Records": [
        {
          "cf": {
            "config": {
              "distributionId": "default"
            },
            "request": {
              "uri": "/featured/rsa"
            }
          }
        }
      ]
    }
    return wrapped.run(event).then((response) => {
      //console.log(response);
      //expect(response).to.not.be.empty;
      //console.log("response status", response.status );
      expect(response.status).to.equal(200);
    });
  });

});
