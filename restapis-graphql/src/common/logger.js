const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';
module.exports.logger = logger;
module.exports.log = (...message) => {
  if(typeof(message) === 'string'){
    logger.info(message);
  } else {
    if(message.length === 1){
      logger.info(message[0]);
    } else {
      logger.info(JSON.stringify(message));
    } 
  }
}
module.exports.debug = (...message) => {
  logger.debug(message);
}
module.exports.error = (...message) => {
  logger.error(message);
}