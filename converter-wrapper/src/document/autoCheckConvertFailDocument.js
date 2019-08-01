'use strict';
const { mongodb, tables, constants } = require('decompany-app-properties');
const { MongoWapper } = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {

  const wrapper = new MongoWapper(mongodb.endpoint);

  const result = await updateConvertFailAll(wrapper);

  console.log("updateConvertFailAll", result, result.length);
  
  return callback(null, {success: true, result});
};


function updateConvertFailAll(wrapper) {
  const expiredAt = Date.now() - 1000 * 60 * 5; //
  const {DOCUMENT} = constants;
  const {STATE} = DOCUMENT;
  return new Promise((resolve, reject) => {
    const query = {state: {$nin: [STATE.CONVERT_COMPLETE, STATE.CONVERT_FAIL]}, created: {$lt: expiredAt}}
    wrapper.update(tables.DOCUMENT, query, {$set: {state: STATE.CONVERT_FAIL}}, {multi: true})
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    });
  });

}
