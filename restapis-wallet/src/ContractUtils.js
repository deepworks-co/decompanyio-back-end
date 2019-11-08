'use strict';

module.exports = {
  buildContract
}

function buildContract(web3, json, networkId) {
  const address = json.networks[networkId].address;
  const contract = new web3.eth.Contract(json.abi, address);
  
  return {address, methods: contract.methods};
}