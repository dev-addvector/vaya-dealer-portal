const fs = require('fs');
const path = require('path');

const UPLOAD_DIRS = process.env.STOCK_UPLOAD_DIRS
  ? process.env.STOCK_UPLOAD_DIRS.split(',')
  : ['/home/vaya/Uploads', '/home/vaya/Uploads1'];

function parseStockFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const isUtf16LE = buf[0] === 0xff && buf[1] === 0xfe;
  const content = isUtf16LE ? buf.toString('utf16le') : buf.toString('utf8');
  const rows = [];
  const records = content.replace(/^\uFEFF/, '').split('$');
  for (const record of records) {
    const fields = record.split('#').map((f) => f.replace(/\|/g, '').trim());
    rows.push(fields);
  }
  return rows;
}

function getFirstFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
  return files.length > 0 ? path.join(dir, files[0]) : null;
}

function parseRow(val) {
  if (!val[0]) return null;
  const raw = val[3] || '';
  const parts = raw.split('/');
  const pattern = (parts[0] || '').trim();
  const color = (parts[1] || '').trim();
  const rollLength = val[1] || '';
  return { pattern, color, rollLength };
}

exports.list = (req, res) => {
  const rows = [];

  for (const dir of UPLOAD_DIRS) {
    const file = getFirstFile(dir);
    if (!file) continue;
    try {
      const parsed = parseStockFile(file);
      rows.push(...parsed);
    } catch (err) {
      // skip unreadable file
    }
  }

  if (rows.length === 0) {
    return res.json({ success: true, data: [], empty: true });
  }

  const data = rows.map(parseRow).filter(Boolean);
  res.json({ success: true, data });
};
