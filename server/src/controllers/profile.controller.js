const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const erpService = require('../services/erp.service');

exports.get = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, zone: true, unc: true, accountingEmail: true },
  });

  let erpDetails = {};
  try {
    erpDetails = await erpService.getUserDetails(user.unc, req.user.keyParse);
  } catch (_) {}

  res.json({ success: true, data: { ...user, ...erpDetails } });
};

exports.resetLoginPassword = async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
  res.json({ success: true, message: 'Password updated' });
};

exports.resetAuthorizationPassword = async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  const hashed = await bcrypt.hash(new_password, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { authorizationPassword: hashed } });
  res.json({ success: true, message: 'Authorization password updated' });
};

exports.validateAuthorizationPassword = async (req, res) => {
  const { authorization_password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(authorization_password, user.authorizationPassword || '');
  res.json({ success: valid, message: valid ? 'Valid' : 'Invalid authorization password' });
};
