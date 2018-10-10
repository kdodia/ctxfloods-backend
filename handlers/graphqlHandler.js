'use strict';
require('promise.prototype.finally').shim();
process.env.DEBUG="graphile-build:warn";
const {createPostGraphileSchema, withPostGraphileContext} = require("postgraphile");
const {graphql} = require('graphql');

const { logError } = require('./logger');
const floodsPool = require('../db/cons/getFloodsPool');

module.exports.handle = (event, context, cb) => {
  let schema;

  return createPostGraphileSchema(floodsPool, "floods", {
    pgDefaultRole: 'floods_anonymous',
    jwtSecret: process.env.JWT_SECRET,
    jwtPgTypeIdentifier: 'floods.jwt_token',
    pgDefaultRole: 'floods_anonymous',
    disableDefaultMutations: true,
    readCache: `${__dirname}/../pgCatalog/postgraphile.cache`
  })
  .then((result) => {
    schema = result;
    console.log("what is in my event? wheres my token?", event)
    let authHeader = (event.headers && event.headers.Authorization) || null;
    const jwtToken = (authHeader ? authHeader.split("Bearer ")[1] : null);
    // console.log("jwtToken", jwtToken)
    return withPostGraphileContext(
      {
        pgPool: floodsPool,
        jwtToken: jwtToken,
        jwtSecret: process.env.JWT_SECRET,
        pgDefaultRole: 'floods_anonymous'
      }, (graphileContext) => {
        console.log("look at the graphile context.", graphileContext)
        return graphql(
          schema,
          event.query,
          null,
          graphileContext,
          event.variables,
          event.operationName
        )
      })
  })
  .then((response)=> {
    // console.log("Did something happen?", response)
    response.statusCode = 200;
    response.headers = { 'Access-Control-Allow-Origin': '*' };
    cb(null, response);
  })
  .catch((err)=>{
    console.log("There was a terrible error", err)
    response.statusCode = 500;
    response.headers = { 'Access-Control-Allow-Origin': '*' };
    let response = {};
    response.errors = err
    cb(null, response)
  })
}











/**




  // Setup connection to PostgresDB
  const pgClient = new Client(require('./constants').PGCON);
  pgClient.connect();

  // Parse PgCatalog
  const PgCatalog = new PgCatalogBuilder.default(PgCat);

  // Set postgraphql options
  // For all options see https://github.com/calebmer/postgraphql/blob/master/docs/library.md
  const options = {
    pgDefaultRole: 'floods_anonymous',
    jwtSecret: process.env.JWT_SECRET,
    jwtPgTypeIdentifier: 'floods.jwt_token',
    pgDefaultRole: 'floods_anonymous',
    disableDefaultMutations: true,
  };
  let gqlSchema;
  createPostGraphQLSchema
    .default(pgClient, PgCatalog, options)
    .then(schema => {
      try {
        gqlSchema = schema;
        // To be honest i am not 100% that the following
        // proppery uses 'begin' ... 'commit'
        pgClient.query('begin').then(() => {
          setupRequestPgClientTransaction
            .default(event, pgClient, {
              jwtSecret: options.jwtSecret,
              pgDefaultRole: options.pgDefaultRole,
            })
            .then(pgRole => {
              graphql(
                gqlSchema,
                event.query,
                null,
                { [pgClientFromContext.$$pgClient]: pgClient },
                event.variables,
                event.operationName,
              )
                .then(response => {
                  pgClient.end();

                  response.statusCode = 200;
                  response.headers = { 'Access-Control-Allow-Origin': '*' };
                  cb(null, response);
                })
                .catch(() => cb(e));
            })
            .then(() => pgClient.query('commit'))
            .catch(err => {
              logError(err);
              cb(null, { errors: [err] });
              pgClient.end();
            });
        });
      } catch (err) {
        logError(err);
        cb(null, { errors: [err] });
        pgClient.end();
      }
    })
    .catch(err => {
      logError(err);
      cb(null, { errors: [err] });
      pgClient.end();
    });
};

**/
