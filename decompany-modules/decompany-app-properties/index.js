'use strict';
const stage = process.env.stage?process.env.stage:"local";



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

module.exports = getProperties(stage);
module.exports.constants = require('./resources/app-constants.json');
module.exports.getProperties = getProperties;
