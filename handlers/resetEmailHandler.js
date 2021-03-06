require('promise.prototype.finally').shim();
const jwt = require('jsonwebtoken');

const { sendEmail } = require('./emailer');
const { logError } = require('./logger');
const getClient = require('../db/helpers/getClient');

async function sendResetEmail(firstname, lastname, email, token, frontendURL, cb) {
  try {
    await sendEmail({
      from: 'CTXfloods <ctxfloodstestmailer@gmail.com>',
      to: `${firstname} ${lastname} <${email}>`,
      subject: 'Reset CTXfloods Password',
      text: `CTXfloods password reset url: ${frontendURL}/dashboard/reset_password/${token}`,
      html: `<p>Click <a href="${frontendURL}/dashboard/reset_password/${token}">here</a> to reset your CTXfloods password.</p>`,
    });

    const response = {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': '*' },
    };

    cb(null, response);
  } catch (err) {
    logError(err);
    const response = {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: {
        errorMessage: err.message
      }
    };
    cb(null, response);
  }
}

module.exports.handle = (event, context, cb) => {
  const pgClient = getClient({clientType: "floodsAPI"});
  const { email } = JSON.parse(event.body);
  const frontendURL = event.headers.origin;
  pgClient.connect();

  pgClient
    .query(
      'select id, last_name, first_name from floods.user where email_address = $1::text',
      [email],
    )
    .then(pgres => {
      if (!pgres.rowCount) {
        const response = {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/plain',
          },
          body: `Could not find user account for email: ${email}`,
        };

        cb(null, response);
        return;
      }

      const firstname = pgres.rows[0].first_name;
      const lastname = pgres.rows[0].last_name;
      const token = jwt.sign(
        { user_id: pgres.rows[0].id, role: 'floods_password_resetter' },
        process.env.JWT_SECRET,
        { expiresIn: '30d', audience: 'postgraphile' },
      );

      return sendResetEmail(firstname, lastname, email, token, frontendURL, cb);
    })
    .catch(err => logError(err))
    .finally(() => pgClient.end());
};
