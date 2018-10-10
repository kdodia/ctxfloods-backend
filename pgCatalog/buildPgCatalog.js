require('promise.prototype.finally').shim();
// process.env.DEBUG="graphile-build:warn";
const {createPostGraphileSchema} = require("postgraphile");
const floodsPool = require('../db/cons/getFloodsPool');

let errFlag;
createPostGraphileSchema(floodsPool, 'floods', {
  writeCache: `${__dirname}/postgraphile.cache`
})
.catch((err)=>{
  console.error(err);
  errFlag = true;
})
.then(() => {
  if (errFlag) process.exit(1);
  process.exit(0);
});
