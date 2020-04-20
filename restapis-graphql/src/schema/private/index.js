
const { schemaComposer } = require('graphql-compose');

// Load Type Composer
require('../type')

// Load Private Schema
const UserDocumentFavorite = require('./UserDocumentFavorite')
const UserDocumentHistory = require('./UserDocumentHistory')

const customizationOptions = {}; // left it empty for simplicity, described below

const schema = schemaComposer.buildSchema();
module.exports = {
  schema
}
