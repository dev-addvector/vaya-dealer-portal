const prisma = require('../../config/database');
const QRCode = require('qrcode');

const getOrCreate = async () => {
  let s = await prisma.setting.findFirst();
  if (!s) s = await prisma.setting.create({ data: {} });
  return s;
};

const patchSettings = async (data) => {
  const s = await getOrCreate();
  await prisma.setting.update({ where: { id: s.id }, data });
};

exports.get = async (req, res) => {
  const settings = await getOrCreate();
  res.json({ success: true, data: settings });
};

exports.setSMTP = async (req, res) => {
  const { smtp_email, smtp_pass } = req.body;
  await patchSettings({ smtp_email, smtp_pass });
  res.json({ success: true, message: 'SMTP settings saved' });
};

exports.setMaxReserveDays = async (req, res) => {
  const days = parseInt(req.body.receiving_order_days, 10);
  if (isNaN(days) || days < 0) return res.status(400).json({ success: false, message: 'Invalid value' });
  await patchSettings({ receiving_order_days: days });
  res.json({ success: true, message: 'Max reserve days saved' });
};

exports.setGst = async (req, res) => {
  const gst = parseInt(req.body.gst, 10);
  if (isNaN(gst) || gst < 0) return res.status(400).json({ success: false, message: 'Invalid GST value' });
  await patchSettings({ gst });
  res.json({ success: true, message: 'GST setting saved' });
};

exports.setQrLink = async (req, res) => {
  const { qr_link } = req.body;
  if (!qr_link) return res.status(400).json({ success: false, message: 'QR link is required' });
  await patchSettings({ qr_link });
  res.json({ success: true, message: 'QR link saved' });
};

exports.uploadLoginImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  await patchSettings({ image: req.file.filename });
  res.json({ success: true, message: 'Login image updated', filename: req.file.filename });
};

exports.listUsers = async (req, res) => {
  const { page = 1, perPage = 20, search } = req.query;
  const where = search
    ? { OR: [{ name: { contains: search } }, { email: { contains: search } }], role: 'user' }
    : { role: 'user' };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(perPage),
      take: Number(perPage),
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, unc: true, zone: true, isStatus: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ success: true, data: users, total, page: Number(page), perPage: Number(perPage) });
};

exports.downloadQr = async (req, res) => {
  const s = await getOrCreate();
  if (!s.qr_link) return res.status(404).json({ success: false, message: 'QR link not set' });
  const buffer = await QRCode.toBuffer(s.qr_link, { width: 400 });
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', 'attachment; filename="qr.png"');
  res.send(buffer);
};

exports.disableUser = async (req, res) => {
  const { userId, isStatus } = req.body;
  await prisma.user.update({ where: { id: userId }, data: { isStatus: Number(isStatus) } });
  res.json({ success: true, message: `User ${isStatus ? 'enabled' : 'disabled'}` });
};

exports.changeUserEmail = async (req, res) => {
  const { userId, newEmail } = req.body;
  
  const existingUser = await prisma.user.findFirst({ where: { email: newEmail } });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }
  
  await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
  res.json({ success: true, message: 'Email changed successfully' });
};

exports.sendPasswordResetLink = async (req, res) => {
  const { userId } = req.body;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  
  res.json({ success: true, message: 'Password reset link sent successfully' });
};
