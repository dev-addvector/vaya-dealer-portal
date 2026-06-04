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
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dcdcdc;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 40px 8px;">
              <p style="margin:0;font-size:22px;font-weight:400;letter-spacing:2px;color:#111111;font-family:Georgia,serif;">Vaya</p>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td align="center" style="padding:24px 40px 16px;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#111111;font-family:Georgia,serif;">Reset Password</h1>
            </td>
          </tr>
          <!-- Body text -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <p style="margin:0;font-size:15px;color:#333333;line-height:1.6;text-align:center;font-family:Georgia,serif;">
                If you've lost your password or wish to reset it, use the link below to get started.
              </p>
            </td>
          </tr>
          <!-- Button -->
          <tr>
            <td align="center" style="padding:0 40px 40px;">
              <a href="${resetLink}" style="display:inline-block;padding:14px 36px;font-size:15px;color:#111111;text-decoration:none;border:1.5px solid #111111;border-radius:50px;font-family:Georgia,serif;letter-spacing:0.5px;">
                Reset Your Password
              </a>
            </td>
          </tr>
          <!-- Footer note -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <p style="margin:0;font-size:12px;color:#999999;text-align:center;font-family:Georgia,serif;">
                This link expires in 1 hour. If you did not request a password reset, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
