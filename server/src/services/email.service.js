const nodemailer = require('nodemailer');
const prisma = require('../config/database');

async function buildTransporter() {
  const settings = await prisma.setting.findFirst();
  const user = settings?.smtp_email || process.env.MAIL_USER;
  const pass = settings?.smtp_pass || process.env.MAIL_PASS;
  const port = Number(process.env.MAIL_PORT) || 587;
  const from = `Vaya <${user}>`;

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return { transporter, from };
}

async function sendForgotPasswordEmail(to, resetLink) {
  const { transporter, from } = await buildTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: 'Reset Your Password — Vaya Dealer Portal',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
}

async function sendWelcomeEmail(to, name) {
  const { transporter, from } = await buildTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: 'Welcome to Vaya Dealer Portal',
    html: `<p>Hello ${name}, your account is ready.</p>`,
  });
}

async function sendResetPasswordEmail(to, tempPassword) {
  const { transporter, from } = await buildTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: 'Your Temporary Password — Vaya Dealer Portal',
    html: `<p>Your temporary password is: <strong>${tempPassword}</strong></p>`,
  });
}

module.exports = { sendForgotPasswordEmail, sendWelcomeEmail, sendResetPasswordEmail };
