const {curry} = require('rambda');
const {walletConfig, mongodb, tables, region} = require("decompany-app-properties");
const {MongoWrapper, kms} = require("decompany-common-utils");
const WalletWrapper = require("./src/lib/WalletWrapper");
const PersistWrapper = require("./src/lib/PersistWrapper");

const mongo = new MongoWrapper(mongodb.endpoint);
const wallet = new WalletWrapper();
const persist = new PersistWrapper();

const context = {mongo, wallet, persist}

const newAccount = require('./src/newAccount');
const transferDeck = require('./src/transferDeck');
const requestGas = require('./src/requestGas');
const getBalance = require('./src/getBalance');
const collectBlock = require('./src/collectBlock');
const foundationTransfer = require('./src/foundationTransfer');


module.exports = {
  newAccount: curry(newAccount)(context),
  transferDeck: curry(transferDeck)(context),
  requestGas: curry(requestGas)(context),
  getBalance: curry(getBalance)(context),
  collectBlock: curry(collectBlock)(context),
  foundationTransfer: curry(foundationTransfer)(context),

}