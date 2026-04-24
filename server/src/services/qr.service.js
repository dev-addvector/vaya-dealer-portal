const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function generateQr(data, fileName) {
  const outputPath = path.join(__dirname, '../../uploads/qr', `${fileName}.png`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await QRCode.toFile(outputPath, data);
  return `${fileName}.png`;
}

async function generateQrPair(brochureKey) {
  const baseUrl = process.env.APP_URL;
  const qrFile = await generateQr(`${baseUrl}/price-list/${brochureKey}`, brochureKey);
  const wopFile = await generateQr(`${baseUrl}/wop/${brochureKey}`, `wop_${brochureKey}`);
  return { qrFile, wopFile };
}

module.exports = { generateQr, generateQrPair };
