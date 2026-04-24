const axios = require('axios');
const PDFDocument = require('pdfkit');

const erpClient = axios.create({
  baseURL: process.env.ERP_API_URL,
  headers: { Authorization: `Bearer ${process.env.ERP_API_TOKEN}` },
});

const erpClientOld = process.env.ERP_API_URL_OLD
  ? axios.create({
      baseURL: process.env.ERP_API_URL_OLD,
      headers: { Authorization: `Bearer ${process.env.ERP_API_TOKEN}` },
    })
  : null;

async function postWithFallback(path, payload, config) {
  try {
    return await erpClient.post(path, payload, config);
  } catch (err) {
    const status = err?.response?.status;
    const code = err?.code;
    const isNetworkError =
      code === 'ETIMEDOUT' ||
      code === 'ECONNABORTED' ||
      code === 'ENOTFOUND' ||
      code === 'ECONNREFUSED' ||
      code === 'EHOSTUNREACH' ||
      code === 'ENETUNREACH';

    if ((status === 404 || isNetworkError) && erpClientOld) {
      return await erpClientOld.post(path, payload, config);
    }
    throw err;
  }
}

async function getProducts({ unc, pattern, color, page = 1, perPage = 50 }) {
  const { data } = await postWithFallback(
    '/ProductOrder/GetLiveProductList',
    { UCN: unc, SearchString: pattern || '' },
    { timeout: 0 }
  );

  let raw = data?.return_field_value || [];

  if (color) {
    raw = raw.filter(p => p.Color?.toLowerCase().includes(color.toLowerCase()));
  }

  // Group by Pattern+Color (same as old project)
  const grouped = {};
  for (const item of raw) {
    const key = `${item.Pattern}||${item.Color}`;
    if (!grouped[key]) {
      grouped[key] = {
        Pattern: item.Pattern,
        Color: item.Color,
        TotalLength: 0,
        NumberOfRolls: 0,
        Rolls: [],
        RollPrice: item['Roll Price'],
        CutPrice: item['Cut Price'],
      };
    }
    grouped[key].TotalLength += Number(item.Length) || 0;
    grouped[key].NumberOfRolls += 1;
    grouped[key].Rolls.push({ PcSINo: item.PcSINo, Length: item.Length });
  }

  const allGrouped = Object.values(grouped);
  const total = allGrouped.length;
  const offset = (page - 1) * perPage;
  const items = allGrouped.slice(offset, offset + perPage);

  return { items, total, page, perPage };
}

function extractOrders(data) {
  return (
    data?.return_field_value?.[0]?.OrderDetails ||
    data?.return_field_value?.[0]?.orderdetails ||
    data?.return_field_value ||
    data?.OrderDetails ||
    []
  );
}

async function getOpenOrders({ unc }) {
  const { data } = await postWithFallback('/Order/GetOrderDetails', {
    UCN: unc,
    OrderType: 'Ordered',
  });
  return extractOrders(data);
}

async function getReservedOrders({ unc }) {
  const { data } = await postWithFallback('/Order/GetOrderDetails', {
    UCN: unc,
    OrderType: 'Reserved',
  });
  return extractOrders(data);
}

async function getMyOrders({ unc }) {
  const { data } = await postWithFallback('/Order/GetOrderDetails', {
    UCN: unc,
    OrderType: 'All',
  });
  return extractOrders(data);
}

async function placeOrder(payload) {
  const { data } = await postWithFallback('/ProductOrder/PostProductOrder', payload);
  return data;
}

async function cancelOrder(unc, id) {
  const { data } = await postWithFallback('/Order/PostOrderCancel', {
    UCN: unc,
    'Order ID': id,
  });
  return data;
}

async function getOrderPdf(invoiceNo) {
  const { data } = await postWithFallback(
    '/PdfFile/DownloadPdfFile',
    { InvoiceNo: invoiceNo },
    { responseType: 'arraybuffer' }
  );
  return data;
}

async function getPriceList(unc) {
  const { data } = await postWithFallback(
    '/PriceList/GetPriceList',
    { UCN: unc },
    { responseType: 'arraybuffer' }
  );
  return data;
}

async function getAddresses(unc) {
  const { data } = await postWithFallback('/Users/GetUserAddress', { UCN: unc });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.return_field_value)) return data.return_field_value;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function addAddress(unc, { address, city, state, country, pincode }) {
  const { data } = await postWithFallback('/Users/PostUserAddress', {
    UCN: unc,
    Address: address,
    Name: 'FGH',
    NickName: 'FGH1',
    City: city,
    State: state,
    Country: country || 'India',
    PinCode: pincode,
    PhoneNumber: '1234567890',
    AddressType: 'Shipping',
    ShippingFlg: 'True',
  });
  return data;
}

async function updateAddress(unc, { addressId, address, city, state, country, pincode }) {
  const { data } = await erpClient.put('/Users/PutUserAddress', {
    UCN: unc,
    AddressId: addressId,
    Address: address,
    Name: 'FGH',
    NickName: 'FGH1',
    City: city,
    State: state,
    Country: country || 'India',
    PinCode: pincode,
    PhoneNumber: '1234567890',
    AddressType: 'Shipping',
    ShippingFlg: 'True',
  });
  return data;
}

async function deleteAddress(unc, addressId) {
  const { data } = await erpClient.delete('/Users/DelUserAddress', {
    data: { UCN: unc, AddressId: addressId },
  });
  return data;
}

async function setDefaultAddress(unc, targetId) {
  const addresses = await getAddresses(unc);
  await Promise.all(
    addresses.map((addr) =>
      erpClient.put('/Users/PutUserAddress', {
        UCN: unc,
        AddressId: addr['Address ID'],
        Address: addr['Address'],
        Name: 'san1',
        NickName: 'sand1',
        City: addr['City'],
        State: addr['State'],
        Country: addr['Country'],
        PinCode: addr['PinCode'],
        PhoneNumber: '1234567890',
        AddressType: 'Shipping',
        ShippingFlg: String(addr['Address ID']) === String(targetId) ? 'True' : 'False',
      })
    )
  );
}

async function getShippingModes(unc) {
  const { data } = await postWithFallback('/ShippingMode/GetShippingMode', { UCN: unc });
  if (Array.isArray(data?.return_field_value)) return data.return_field_value;
  return [];
}

async function getUserDetails(unc, keyParse) {
  const { data } = await postWithFallback('/Users/GetUserDetails', { UCN: unc, 'Key Phrase': keyParse || '' });
  const val = data?.return_field_value?.[0] || {};
  return {
    customerName: val['Consignee Name'] || '',
    customerCode: val['Customer Code'] || '',
    consigneeCategory: val['Consignee Category'] || '',
    erpEmail: val['Email ID'] || '',
    gstTaxId: val['GST/TAX ID'] || '',
    lengthUnit: val['Length Unit'] || '',
    currency: val['Currency'] || '',
    consigneeCountry: val['Consignee Country'] || '',
    paymentTerms: val['Payment Terms'] || '',
    consigneeAddress: val['Consignee Address'] || '',
    erpStatus: val['Status'] || '',
  };
}

async function getPriceListJson(unc) {
  const { data } = await postWithFallback('/PriceList/GetPriceList', { UCN: unc });
  return Array.isArray(data?.return_field_value) ? data.return_field_value : [];
}

async function getReservedOrderByPo(unc, poNumber) {
  const { data } = await postWithFallback('/Order/GetOrderDetails', {
    UCN: unc,
    OrderType: 'Reserved',
  });
  const orders = extractOrders(data);
  const order = orders.find((o) => o.PONumber === poNumber);
  if (!order) throw Object.assign(new Error('Reserved order not found'), { status: 404 });
  if (!Array.isArray(order.OrderItems) || !order.OrderItems.length)
    throw Object.assign(new Error('Reserved order has no items'), { status: 400 });
  return order;
}

async function getLiveProductsRaw(unc) {
  const { data } = await postWithFallback(
    '/ProductOrder/GetLiveProductList',
    { UCN: unc, SearchString: '' },
    { timeout: 0 }
  );
  return Array.isArray(data?.return_field_value) ? data.return_field_value : [];
}

async function getStocks(unc = 'BC') {
  const { data } = await postWithFallback('/Stock/GetStockDetails', { UCN: unc });
  if (Array.isArray(data?.return_field_value)) return data.return_field_value;
  if (Array.isArray(data)) return data;
  return [];
}

async function getOrdersByUnc(unc, orderType = 'All') {
  const { data } = await postWithFallback('/Order/GetOrderDetails', { UCN: unc, OrderType: orderType });
  return extractOrders(data);
}

function _fmtNum(n) {
  return Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function generateOpenOrderPdf({ unc, poNumber }) {
  const { data: ordersData } = await postWithFallback('/Order/GetOrderDetails', {
    UCN: unc,
    OrderType: 'All',
  });
  const orders = extractOrders(ordersData);
  const order = orders.find(o => o.PONumber === poNumber);
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }

  let address = { Name: '', Address: '', City: '', State: '', PinCode: '' };
  if (order.BillingAddressID) {
    try {
      const { data: addrData } = await postWithFallback('/Users/GetUserAddress', {
        UCN: unc,
        AddressId: order.BillingAddressID,
      });
      const addrArr = Array.isArray(addrData) ? addrData
        : Array.isArray(addrData?.return_field_value) ? addrData.return_field_value
        : [];
      if (addrArr.length > 0) address = addrArr[0];
    } catch (_) { /* proceed without address */ }
  }

  let logoBuffer = null;
  try {
    const logoPath = require('path').join(__dirname, '../../../client/public/images/logo.png');
    logoBuffer = require('fs').readFileSync(logoPath);
  } catch (_) { /* fall back to text logo */ }

  // Calculate line items and totals
  const items = Array.isArray(order.OrderItems) ? order.OrderItems : [];
  let totalAmount = 0, totalDiscount = 0, totalGst = 0;
  const itemData = items.map((item) => {
    const rate = parseFloat(item.Rate) || 0;
    const qty  = parseFloat(item.OrderdLength) || 0;
    const subtotal       = rate * qty;
    const discountAmount = Math.max(0, parseFloat(item.DiscountVal) || 0);
    const itemGst        = parseFloat(item.TaxAmount) || 0;
    const itemTotal      = subtotal - discountAmount + itemGst;
    totalAmount   += subtotal;
    totalDiscount += discountAmount;
    totalGst      += itemGst;
    return { item, rate, qty, subtotal, discountAmount, itemGst, itemTotal };
  });
  const grandTotal = totalAmount - totalDiscount + totalGst;

  const pin     = (address.PinCode || '').toString().trim();
  const addrStr = (address.Address || '').toString().trim();
  const addrLine  = pin && !addrStr.includes(pin) ? `${addrStr} — ${pin}` : addrStr;
  const cityState = [address.City, address.State].filter(Boolean).join(', ');

  // Build PDF with pdfkit
  const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W  = doc.page.width;   // 595.28
    const M  = 32;                // horizontal margin
    const CW = W - M * 2;        // content width ≈ 531

    // Column widths (sum = CW): Item | Price | Qty | Subtotal | Discount | GST | Net
    const cols  = [154, 63, 37, 69, 63, 63, 82];
    const colX  = cols.map((_, i) => M + cols.slice(0, i).reduce((s, v) => s + v, 0));
    const heads = ['Item & Description', 'List Price', 'Qty', 'Subtotal', 'Discount', 'GST', 'Net Amount'];
    const aligns = ['left', 'right', 'right', 'right', 'right', 'right', 'right'];

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
       .text(order.OrderDate || '—', M, 36, { width: CW, align: 'right' });

    // header border
    doc.rect(0, 80, W, 3).fill('#111111');
    y = 83;

    // ── TITLE BAR ──
    doc.rect(0, y, W, 52).fill('#111111');
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
       .text('PI FOR FABRIC', M, y + 10, { characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#c8bf9a')
       .text(`Ref  #  ${order.PONumber || '—'}`, M, y + 30);
    y += 52;

    // ── BILL TO ──
    y += 24;
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#807A52')
       .text('BILL TO', M, y, { characterSpacing: 1.5 });
    y += 14;
    if (address.Name) {
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text(address.Name, M, y);
      y += 20;
    }
    doc.font('Helvetica').fontSize(11).fillColor('#555555');
    if (addrLine) { doc.text(addrLine, M, y); y += 16; }
    if (cityState) { doc.text(cityState, M, y); y += 16; }

    // ── DIVIDER ──
    y += 8;
    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.5).strokeColor('#e8e8e4').stroke();
    y += 16;

    // ── TABLE HEADER ──
    const rowH = 28;
    doc.rect(M, y, CW, 32).fill('#111111');
    heads.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
         .text(h, colX[i] + 4, y + 10, { width: cols[i] - 8, align: aligns[i], lineBreak: false });
    });
    y += 32;

    // ── TABLE ROWS ──
    itemData.forEach(({ item, rate, qty, subtotal, discountAmount, itemGst, itemTotal }, idx) => {
      if (y + rowH > doc.page.height - 120) { doc.addPage(); y = 40; }
      doc.rect(M, y, CW, rowH).fill(idx % 2 === 0 ? '#ffffff' : '#f9f9f7');
      const vals = [
        `${item.Pattern || ''} — ${item.Color || ''}`,
        _fmtNum(rate), String(Math.round(qty)),
        _fmtNum(subtotal), _fmtNum(discountAmount), _fmtNum(itemGst), _fmtNum(itemTotal),
      ];
      vals.forEach((v, i) => {
        doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(10).fillColor(i === 0 ? '#222222' : '#555555')
           .text(v, colX[i] + 4, y + 9, { width: cols[i] - 8, align: aligns[i], lineBreak: false });
      });
      doc.moveTo(M, y + rowH).lineTo(W - M, y + rowH).lineWidth(0.5).strokeColor('#eeeeee').stroke();
      y += rowH;
    });

    // ── TOTALS ──
    const totals = [['Sub Total', _fmtNum(totalAmount)], ['Total Discount', _fmtNum(totalDiscount)], ['Total GST', _fmtNum(totalGst)]];
    totals.forEach(([label, val]) => {
      if (y + 24 > doc.page.height - 80) { doc.addPage(); y = 40; }
      doc.font('Helvetica').fontSize(11).fillColor('#555555')
         .text(label, M, y + 7, { width: CW - cols[cols.length - 1] - 4, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111')
         .text(val, M, y + 7, { width: CW, align: 'right' });
      doc.moveTo(M, y + 24).lineTo(W - M, y + 24).lineWidth(0.5).strokeColor('#eeeeee').stroke();
      y += 24;
    });

    // Grand Total bar
    if (y + 36 > doc.page.height - 60) { doc.addPage(); y = 40; }
    doc.rect(M, y, CW, 36).fill('#111111');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
       .text('Grand Total', M + 4, y + 11, { width: CW - cols[cols.length - 1] - 8, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
       .text(_fmtNum(grandTotal), M, y + 10, { width: CW - 4, align: 'right' });
    y += 36;

    // ── FOOTER ──
    y += 20;
    doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.5).strokeColor('#e8e8e4').stroke();
    y += 10;
    doc.font('Helvetica').fontSize(9).fillColor('#aaaaaa')
       .text('This is a computer-generated proforma invoice and does not require a signature.', M, y, { width: CW, align: 'center' });

    doc.end();
  });
}

async function postAccountingEmail(unc, email, accountingEmail) {
  const { data } = await postWithFallback('/Users/PostUserAccountingEmail', {
    UCN: unc,
    'Email ID': email,
    'Accounting Email ID': accountingEmail,
  });
  return data;
}

module.exports = { getProducts, getOpenOrders, getReservedOrders, getMyOrders, placeOrder, cancelOrder, getReservedOrderByPo, getLiveProductsRaw, getOrderPdf, generateOpenOrderPdf, getPriceList, getPriceListJson, getUserDetails, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, getShippingModes, getStocks, getOrdersByUnc, postAccountingEmail };
