const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function generateQr(data, fileName) {
  const outputPath = path.join(__dirname, '../../uploads/qr', `${fileName}.png`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await QRCode.toFile(outputPath, data);
  return `uploads/qr/${fileName}.png`;
}

module.exports = { generateQr };
