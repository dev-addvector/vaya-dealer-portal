const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { sign } = require('../utils/jwt');
const { randomToken } = require('../utils/helpers');
const emailService = require('../services/email.service');
const erpService = require('../services/erp.service');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

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

// Decode UNC from URL-safe base64, fetch ERP data, check if already registered
exports.getRegisterInfo = async (req, res) => {
  const { encrypted_unc, key_phrase } = req.params;
  const b64 = encrypted_unc.replace(/-/g, '/');
  const unc = Buffer.from(b64, 'base64').toString('utf-8');

  const erpData = await erpService.getUserDetails(unc, key_phrase);
  if (!erpData.customerName && !erpData.erpEmail)
    return res.status(404).json({ success: false, message: 'Invalid or expired invite link' });

  const existing = await prisma.user.findFirst({ where: { unc } });
  if (existing)
    return res.status(409).json({ success: false, message: 'Already registered', redirect: true });

  res.json({ success: true, unc, keyPhrase: key_phrase, erpData });
};

exports.checkEmail = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  res.json({ exists: !!user });
};

exports.register = async (req, res) => {
  const { unc, keyPhrase, email, accountingEmail, password, authorizationPassword } = req.body;

  if (!email || !password || !authorizationPassword || !unc)
    return res.status(400).json({ success: false, message: 'All fields are required' });

  if (!PASSWORD_REGEX.test(password))
    return res.status(400).json({ success: false, message: 'Password must be 8–20 chars with uppercase, lowercase, digit, and special character (@$!%*?&)' });

  if (!PASSWORD_REGEX.test(authorizationPassword))
    return res.status(400).json({ success: false, message: 'Authorization password must be 8–20 chars with uppercase, lowercase, digit, and special character (@$!%*?&)' });

  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists)
    return res.status(400).json({ success: false, message: 'Email already registered' });

  const uncExists = await prisma.user.findFirst({ where: { unc } });
  if (uncExists)
    return res.status(409).json({ success: false, message: 'Already registered', redirect: true });

  const erpData = await erpService.getUserDetails(unc, keyPhrase);

  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedAuthPassword = await bcrypt.hash(authorizationPassword, 10);

  await prisma.user.create({
    data: {
      name: erpData.customerName || '',
      email,
      accountingEmail: accountingEmail || '',
      password: hashedPassword,
      authorizationPassword: hashedAuthPassword,
      unc,
      keyParse: keyPhrase,
      role: 'user',
      isStatus: 1,
    },
  });

  try {
    await erpService.postAccountingEmail(unc, email, accountingEmail || '');
  } catch (_) { /* non-critical — don't fail registration */ }

  res.json({ success: true, message: 'Account set up successfully' });
};
