const nodemailer = require('nodemailer');

const port = Number(process.env.MAIL_PORT);
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port,
  secure: port === 465,       // true for SSL (465), false for STARTTLS (587)
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

module.exports = transporter;
