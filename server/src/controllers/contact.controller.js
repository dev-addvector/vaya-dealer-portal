const prisma = require('../config/database');

exports.list = async (req, res) => {
  const contacts = await prisma.userContact.findMany({ where: { userId: req.user.id } });
  res.json({ success: true, data: contacts });
};

exports.add = async (req, res) => {
  const { name, phone, email } = req.body;
  const contact = await prisma.userContact.create({
    data: { userId: req.user.id, name, phone, email },
  });
  res.json({ success: true, data: contact });
};

exports.update = async (req, res) => {
  const { id, name, phone, email } = req.body;
  await prisma.userContact.updateMany({
    where: { id: Number(id), userId: req.user.id },
    data: { name, phone, email },
  });
  res.json({ success: true, message: 'Contact updated' });
};

exports.remove = async (req, res) => {
  await prisma.userContact.deleteMany({
    where: { id: Number(req.params.id), userId: req.user.id },
  });
  res.json({ success: true, message: 'Contact deleted' });
};

exports.setDefault = async (req, res) => {
  const { id } = req.body;
  await prisma.userContact.updateMany({ where: { userId: req.user.id }, data: { isDefault: 0 } });
  await prisma.userContact.updateMany({ where: { id: Number(id), userId: req.user.id }, data: { isDefault: 1 } });
  res.json({ success: true, message: 'Default contact set' });
};
