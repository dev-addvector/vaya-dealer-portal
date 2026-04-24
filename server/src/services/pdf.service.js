const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function _fmt(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _logoBuffer() {
  try {
    return fs.readFileSync(path.join(__dirname, '../../../client/public/images/logo.png'));
  } catch (_) { return null; }
}

async function generatePriceListPdf({ userDetails, items }) {
  const logoBuffer = _logoBuffer();
  const date = new Date().toLocaleDateString('en-IN');

  const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W  = doc.page.width;
    const M  = 32;
    const CW = W - M * 2;

    let y = 0;

    // ── HEADER ──
    doc.rect(0, 0, W, 83).fill('#ffffff');
    if (logoBuffer) {
      try { doc.image(logoBuffer, M, 20, { height: 40, fit: [160, 40] }); }
      catch (_) { doc.font('Helvetica-Bold').fontSize(22).fillColor('#111111').text('VAYA', M, 28); }
    } else {
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#111111').text('VAYA', M, 28);
    }
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#807A52')
       .text('DATE', M, 24, { width: CW, align: 'right', characterSpacing: 1.2 });
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111111')
       .text(date, M, 36, { width: CW, align: 'right' });
    doc.rect(0, 80, W, 3).fill('#111111');
    y = 83;

    // ── TITLE BAR ──
    doc.rect(0, y, W, 44).fill('#111111');
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
       .text('VAYA PRICE LIST', M, y + 14, { characterSpacing: 1 });
    y += 44;

    // ── CUSTOMER INFO ──
    y += 20;
    const infoLines = [
      ['Customer Name',       userDetails.customerName],
      ['Customer Code',       userDetails.customerCode],
      ['Consignee Category',  userDetails.consigneeCategory],
    ].filter(([, v]) => v);

    infoLines.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#807A52').text(`${label}: `, M, y, { continued: true });
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(value);
      y += 16;
    });

    // ── DIVIDER ──
    y += 8;
    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.5).strokeColor('#e8e8e4').stroke();
    y += 14;

    // ── TABLE ──
    const colW   = [CW * 0.6, CW * 0.2, CW * 0.2];
    const colX   = [M, M + colW[0], M + colW[0] + colW[1]];
    const heads  = ['Pattern', 'DP Cut Price', 'DP Roll Price'];
    const rowH   = 24;
    const headH  = 28;

    const drawTableHeader = () => {
      doc.rect(M, y, CW, headH).fill('#E3E8CC');
      heads.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
           .text(h, colX[i] + 6, y + 8, { width: colW[i] - 12, align: i === 0 ? 'left' : 'right', lineBreak: false });
      });
      y += headH;
    };

    drawTableHeader();

    items.forEach((item, idx) => {
      if (y + rowH > doc.page.height - 40) {
        doc.addPage();
        y = 40;
        drawTableHeader();
      }

      doc.rect(M, y, CW, rowH).fill(idx % 2 === 0 ? '#ffffff' : '#f9f9f7');
      const vals = [
        item.Pattern || '',
        item['Cut Price']  ? _fmt(item['Cut Price'])  : '—',
        item['Roll Price'] ? _fmt(item['Roll Price']) : '—',
      ];
      vals.forEach((v, i) => {
        doc.font('Helvetica').fontSize(10).fillColor('#333333')
           .text(v, colX[i] + 6, y + 7, { width: colW[i] - 12, align: i === 0 ? 'left' : 'right', lineBreak: false });
      });
      doc.moveTo(M, y + rowH).lineTo(W - M, y + rowH).lineWidth(0.5).strokeColor('#eeeeee').stroke();
      y += rowH;
    });

    // ── FOOTER ──
    y += 16;
    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.5).strokeColor('#e8e8e4').stroke();
    y += 10;
    doc.font('Helvetica').fontSize(9).fillColor('#aaaaaa')
       .text('This is a computer-generated price list and is subject to change without notice.', M, y, { width: CW, align: 'center' });

    doc.end();
  });
}

module.exports = { generatePriceListPdf };
