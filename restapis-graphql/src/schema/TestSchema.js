const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const authors = [
  { id: 1, firstName: 'Tom', lastName: 'Coleman' },
  { id: 2, firstName: 'Sashko', lastName: 'Stubailo' },
  { id: 3, firstName: 'Mikhail', lastName: 'Novikov' },
];

const posts = [
  { id: 1, authorId: 1, title: 'Introduction to GraphQL', votes: 2 },
  { id: 2, authorId: 2, title: 'Welcome to Apollo', votes: 3 },
  { id: 3, authorId: 2, title: 'Advanced GraphQL', votes: 1 },
  { id: 4, authorId: 3, title: 'Launchpad is Cool', votes: 7 },
];
const AuthorTC = schemaComposer.createObjectTC({
  name: 'Author',
  fields: {
    id: 'Int!',
    firstName: 'String',
    lastName: 'String',
  },
});

const PostTC = schemaComposer.createObjectTC({
  name: 'Post',
  fields: {
    id: 'Int!',
    title: 'String',
    votes: 'Int',
    authorId: 'Int',
  },
});
schemaComposer.Query.addFields({
  "posts": {
    type: '[Post]',
    args: { id: 'Int!', blockchainTimestamp: 'Int!' },
    resolve: (_, {id, blockchainTimestamp}) => posts,
  }  
});
schemaComposer.Query.addNestedFields({
  "Test.posts": {
    type: '[Post]',
    args: { id: 'Int!', blockchainTimestamp: 'Int!' },
    resolve: (_, {id, blockchainTimestamp}) => posts,
  },
  "Test.author": {
    type: 'Author',
    args: { id: 'Int!' },
    resolve: (_, { id }) => {
      return authors[id];
      //return find(authors, { id })
    }
    
  }
  
});



// Requests which modify data put into Mutation
schemaComposer.Mutation.addNestedFields({
  "Test.upvotePost": {
    type: 'Post',
    args: {
      postId: 'Int!',
    },
    resolve: (_, { postId }) => {
      const post = find(posts, { id: postId });
      if (!post) {
        throw new Error(`Couldn't find post with id ${postId}`);
      }
      post.votes += 1;
      return post;
    },
  },
});
module.exports = schemaComposer.buildSchema();