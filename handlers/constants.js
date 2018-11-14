module.exports.SENTRY_DSN =
  'https://2627dd87d0fd4249a65d160aef644f88@sentry.io/1191657';

module.exports.PGCON =
  `postgresql://floods_postgraphql:xyz@${process.env.PGENDPOINT}:5432/floods`;

module.exports.PGCON_BUILD_SCHEMA =
  `postgresql://${process.env.PGUSERNAME}:${process.env.PGPASSWORD}@${process.env.PGENDPOINT}:5432/floods`

let frontendURL;
if (process.env.AWS_SERVICE_NAME === 'ctxfloods-backend-prod-legacy-sync') {
  frontendURL = 'floods.austintexas.io';
} else if (process.env.AWS_SERVICE_NAME === 'ctxfloods-backend-prod') {
  frontendURL = 'floodstest.austintexas.io';
} else if (!process.env.AWS_SERVICE_NAME) {
  frontendURL = 'localhost:3000';
} else {
  // Assume the deployed dev branches will point to a corresponding frontend with the same branch name
  frontendURL = `${process.env.AWS_SERVICE_NAME.replace('ctxfloods-backend','ctxfloods-frontend')}.s3-website-us-east-1.amazonaws.com`
}
module.exports.frontendURL = frontendURL;
