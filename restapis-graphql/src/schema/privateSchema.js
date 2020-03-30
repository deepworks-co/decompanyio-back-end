
const { schemaComposer } = require('graphql-compose');
const UserDocumentFavorite = require('./private/UserDocumentFavorite')
const UserDocumentHistory = require('./private/UserDocumentHistory')

const customizationOptions = {}; // left it empty for simplicity, described below

const schema = schemaComposer.buildSchema();
module.exports = {
  schema
}
