'use strict';
const stage = process.env.stage?process.env.stage:"local";
const constants = require('./resources/app-constants.json');

function getProperties(stage){
  try{
    //console.log(`Get properties ${stage}`);
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
module.exports.constants = constants;
module.exports.getProperties = getProperties;
