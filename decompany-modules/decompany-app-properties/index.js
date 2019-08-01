'use strict';
const stage = process.env.stage?process.env.stage:"local";

module.exports = getProperties(stage);

function getProperties(stage){
  try{

    if(stage) {
      return require('./resources/app-properties.'+ stage + '.json');
    } else {
      return require('./resources/app-properties.json');    
    }
  } catch(e){
      console.error(e);
  }

}

module.exports.constants = require('./resources/app-constants.json');
