const {curry} = require('rambda');
const {walletConfig, mongodb, tables, region} = require("decompany-app-properties");
const {MongoWrapper, kms} = require("decompany-common-utils");
const WalletWrapper = require("./src/lib/WalletWrapper");

const mongo = new MongoWrapper(mongodb.endpoint);
const wallet = new WalletWrapper();

const context = {mongo, wallet}

const newAccount = require('./src/newAccount');
const transferDeck = require('./src/transferDeck');
const requestGas = require('./src/requestGas');
const getBalance = require('./src/getBalance');

module.exports = {
  newAccount: curry(newAccount)(context),
  transferDeck: curry(transferDeck)(context),
  requestGas: curry(requestGas)(context),
  getBalance: curry(getBalance)(context)
}