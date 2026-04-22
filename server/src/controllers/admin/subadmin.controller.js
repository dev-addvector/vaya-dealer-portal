const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const { SUBADMIN_ROLES } = require('../../config/constants');

const ROLE_LABELS = {
  sub_admin: 'Sub admin',
  subadmin: 'Sub admin',
  zone_admin: 'Zone admin',
  qr_admin: 'Qr admin',
};

exports.list = async (req, res) => {
  const subadmins = await prisma.user.findMany({
    where: { role: { in: SUBADMIN_ROLES } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, zone: true, isStatus: true, createdAt: true },
  });
  const data = subadmins.map((s) => ({
    ...s,
    roleLabel: ROLE_LABELS[s.role] || s.role,
  }));
  res.json({ success: true, data });
};

exports.create = async (req, res) => {
  const { name, email, password, role, zone } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
  if (role === 'zone_admin' && !zone)
    return res.status(400).json({ success: false, message: 'Zone is required for Zone admin' });
  if (!SUBADMIN_ROLES.includes(role))
    return res.status(400).json({ success: false, message: 'Invalid role' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      zone: role === 'zone_admin' ? zone : null,
    },
    select: { id: true, name: true, email: true, role: true, zone: true },
  });
  res.json({ success: true, data: user });
};

exports.update = async (req, res) => {
  const { name, role, zone, password } = req.body;
  if (!name || !role)
    return res.status(400).json({ success: false, message: 'Name and role are required' });
  if (role === 'zone_admin' && !zone)
    return res.status(400).json({ success: false, message: 'Zone is required for Zone admin' });
  if (!SUBADMIN_ROLES.includes(role))
    return res.status(400).json({ success: false, message: 'Invalid role' });

  const updateData = {
    name,
    role,
    zone: role === 'zone_admin' ? zone : null,
  };
  if (password) updateData.password = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: updateData,
  });
  res.json({ success: true, message: 'Subadmin updated' });
};

exports.remove = async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true, message: 'Subadmin deleted' });
};
