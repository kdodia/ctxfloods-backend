const {Client} = require('pg');

const configOptions = {
  host: process.env.PGENDPOINT,
  port: 5432,
  user: process.env.PGUSERNAME,
  password: process.env.PGPASSWORD,
  database: "floods"
};

const client = new Client(configOptions)

process.on('SIGTERM', () => {
  console.log("Signal Terminated - closing pg client");
  client.end();
});
process.on('SIGINT', () => {
  console.log("Signal Interrupted - closing pg client");
  return client.end();
});
process.on('exit', () => {
  if (!client._ending && client._connected) {
    console.log("Process Exiting - closing pg client");
    client.end();
  }
});

module.exports = () => {
  return client.connect()
  .then(() => {
    return client
  })
}
