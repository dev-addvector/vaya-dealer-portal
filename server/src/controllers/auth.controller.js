const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { sign } = require('../utils/jwt');
const { randomToken } = require('../utils/helpers');
const emailService = require('../services/email.service');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  if (user.isStatus === 0)
    return res.status(403).json({ success: false, message: 'Account disabled' });
  const token = sign({ id: user.id.toString(), role: user.role });
  res.json({
    success: true,
    token,
    user: { id: user.id.toString(), name: user.name, email: user.email, role: user.role, unc: user.unc },
  });
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};

exports.getLoginImage = async (req, res) => {
  const settings = await prisma.setting.findFirst();
  const image = settings?.image ? `/uploads/settings/${settings.image}` : null;
  res.json({ success: true, image });
};

exports.sendForgotPasswordLink = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ success: true, message: 'If email exists, a reset link has been sent' });
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 3600000);
  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    create: { userId: user.id, token, expiresAt },
    update: { token, expiresAt },
  });
  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await emailService.sendForgotPasswordEmail(email, link);
  res.json({ success: true, message: 'Reset link sent to your email' });
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date())
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
  await prisma.passwordResetToken.delete({ where: { token } });
  res.json({ success: true, message: 'Password reset successfully' });
};
