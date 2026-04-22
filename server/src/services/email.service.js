const transporter = require('../config/mailer');

async function sendForgotPasswordEmail(to, resetLink) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Reset Your Password — Vaya Dealer Portal',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
}

async function sendWelcomeEmail(to, name) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Welcome to Vaya Dealer Portal',
    html: `<p>Hello ${name}, your account is ready.</p>`,
  });
}

async function sendResetPasswordEmail(to, tempPassword) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Your Temporary Password — Vaya Dealer Portal',
    html: `<p>Your temporary password is: <strong>${tempPassword}</strong></p>`,
  });
}

module.exports = { sendForgotPasswordEmail, sendWelcomeEmail, sendResetPasswordEmail };
