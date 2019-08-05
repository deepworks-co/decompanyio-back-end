'use strict';
const { mongodb, tables, constants } = require('decompany-app-properties');
const { MongoWapper } = require('decompany-common-utils');

module.exports.handler = async (event, context, callback) => {

  const wrapper = new MongoWapper(mongodb.endpoint);

  const result = await updateConvertFailAll(wrapper);

  console.log("updateConvertFailAll", result);

  wrapper.close();
  
  return callback(null, {success: true, result});
};


function updateConvertFailAll(wrapper) {
  const failAt = Date.now() - 1000 * 60 * 5; //5mins
  const {STATE} = constants.DOCUMENT;

  return new Promise((resolve, reject) => {
    const query = {state: {$in: [STATE.UPLOAD_COMPLETE, STATE.NOT_CONVERT]}, created: {$gt: failAt}}
    wrapper.update(tables.DOCUMENT, query, {$set: {state: STATE.CONVERT_FAIL}}, {multi: true})
    .then((data)=>{
      resolve(data);
    })
    .catch((err)=>{
      reject(err);
    });
  });

}
