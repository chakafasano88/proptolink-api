const { GraphQLServer } = require('graphql-yoga')
const { prisma } = require('./generated/prisma-client')
require('dotenv').config({ path: '.env' })
// const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken')
const db = require('./db');
const Mutation = require('./resolvers/Mutation');
const Query = require('./resolvers/Query');
const bodyParser = require('body-parser');

const resolvers = {
  Query,
  Mutation
}

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: request => {
    return {
      ...request,
      db,
    }
  },
})

// server.express.use(cookieParser());

const server = createServer();

server.start(() => console.log(`Server is running on http://localhost:4000`))