const {Client, Pool} = require('pg');

/**
  Get a single client for a database.
  The host, users, and passwords are taken from environment variables.

  @param clientType - either "floodsAPI" or "master"
  "floodsAPI" will point to "floods" database and login with the floods_api user.
  "master" will point to default "postgres" database and login with master username/password.
  "master" should only be used for database initialization/migration scripts.
  Both point to the PGENDPOINT defined in environment variables.
**/
const getClient = (clientType, pool=false) => {
  let user, password, database;
  if (clientType === "floodsAPI") {
    user = "floods_postgraphql";
    password = "xyz";
    database = "floods";
  } else if (clientType === "master") {
    user = process.env.PGUSERNAME;
    password = process.env.PGPASSWORD;
    database = "postgres";
  } else {
    return Promise.reject(`Please enter a valid client type; ex. "floodsAPI"`)
  }

  const configOptions = {
    host: process.env.PGENDPOINT,
    port: 5432,
    user: user,
    password: password,
    database: database
  };

  if (pool) {
    const pool = new Pool(configOptions)

    process.on('SIGTERM', () => {
      console.log("Signal Terminated - closing pg pool");
      pool.end();
    });
    process.on('SIGINT', () => {
      console.log("Signal Interrupted - closing pg pool");
      pool.end();
    });
    process.on('exit', (code) => {
      console.log("Process Exiting - closing pg pool");
      pool.end();
    });

    return pool.connect()
    .then((client) => {
      return client
    })
  } else if (!pool) {
    const client = new Client(configOptions)

    process.on('SIGTERM', () => {
      console.log("Signal Terminated - closing pg client");
      client.end();
    });
    process.on('SIGINT', () => {
      console.log("Signal Interrupted - closing pg client");
      client.end();
    });

    return client.connect()
    .then(() => {
      return client
    })
  }
};

/**
  Made scaffolding into 2 seperate functions so that users wouldn't get them confused.
  There exists one very important distinction between the two functions.

  In getClientFromPool, clients are released back into the pool by calling client.release()
  In getClient, clients are ended by calling client.end()

  Always close clients when you're done using them, even on errors.
**/
module.exports.getClientFromPool = (clientType) => {
  return getClient(clientType, true)
}

module.exports.getClient = (clientType) => {
  return getClient(clientType, false)
}
