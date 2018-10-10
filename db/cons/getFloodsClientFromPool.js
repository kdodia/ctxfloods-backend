const {Pool} = require('pg');

const configOptions = {
  host: process.env.PGENDPOINT,
  port: 5432,
  user: "floods_postgraphql",
  password: "xyz",
  database: "floods"
};

const pool = new Pool(configOptions)

process.on('SIGTERM', () => {
  console.log("Signal Terminated - closing pg pool");
  pool.end();
});
process.on('SIGINT', () => {
  console.log("Signal Interrupted - closing pg pool");
  pool.end();
});

// TODO: Look at how to handle pool exits
// process.on('exit', () => {
//   if (!client._ending && client._connected) {
//     console.log("Process Exiting - closing pg client");
//     client.end();
//   }
// });

module.exports = () => {
  return pool.connect()
  .then((client) => {
    return client
  })
}
