const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { sign } = require('../../utils/jwt');
const erpService = require('../../services/erp.service');
const emailService = require('../../services/email.service');
const { randomToken } = require('../../utils/helpers');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ success: false, code: 401, message: 'Invalid credentials' });
  if (user.isStatus === 0)
    return res.status(403).json({ success: false, code: 403, message: 'Account disabled' });
  const token = sign({ id: user.id });
  res.json({
    success: true, code: 200, message: 'Login successful',
    user: { token, ucn: user.unc, keyPhrase: user.keyParse },
  });
};

exports.sendForgotPasswordLink = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ status: true, message: 'If email exists, a reset link was sent' });
  const token = randomToken();
  await prisma.passwordReset.upsert({
    where: { userId: user.id },
    create: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600000) },
    update: { token, expiresAt: new Date(Date.now() + 3600000) },
  });
  const link = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await emailService.sendForgotPasswordEmail(email, link);
  res.json({ status: true, message: 'Reset link sent' });
};

exports.validateAuthPassword = async (req, res) => {
  const { authorization_password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(authorization_password, user.authorizationPassword || '');
  res.json({ success: valid, code: valid ? 200 : 400, message: valid ? 'Valid' : 'Invalid' });
};

exports.resetAuthPassword = async (req, res) => {
  const { old_password, new_password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.authorizationPassword && !(await bcrypt.compare(old_password, user.authorizationPassword)))
    return res.status(400).json({ success: false, code: 400, message: 'Old password incorrect' });
  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { authorizationPassword: hashed } });
  res.json({ success: true, code: 200, message: 'Authorization password updated' });
};

exports.downloadPriceList = async (req, res) => {
  const { type } = req.params;
  const buffer = await erpService.getPriceList(type);
  res.setHeader('Content-Type', type === 'pdf' ? 'application/pdf' : 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=pricelist.${type}`);
  res.send(buffer);
};

exports.downloadOrder = async (req, res) => {
  const { po_number } = req.body;
  const buffer = await erpService.getOrderPdf(po_number);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=order-${po_number}.pdf`);
  res.send(buffer);
};

exports.listEBrochures = async (req, res) => {
  const brochures = await prisma.ebrochure.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ status: true, code: 200, data: brochures, message: 'Success' });
};
