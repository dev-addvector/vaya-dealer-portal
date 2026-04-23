const axios = require('axios');
const puppeteer = require('puppeteer');

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

function _buildOpenOrderHtml(order, address, logoDataUri = '') {
  const items = Array.isArray(order.OrderItems) ? order.OrderItems : [];
  let totalAmount = 0, totalDiscount = 0, totalGst = 0;

  const itemRows = items.map((item, idx) => {
    const rate = parseFloat(item.Rate) || 0;
    const qty = parseFloat(item.OrderdLength) || 0;
    const subtotal = rate * qty;
    const discountAmount = Math.max(0, parseFloat(item.DiscountVal) || 0);
    const itemGst = parseFloat(item.TaxAmount) || 0;
    const itemTotal = subtotal - discountAmount + itemGst;
    totalAmount += subtotal;
    totalDiscount += discountAmount;
    totalGst += itemGst;
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9f9f7';
    return `<tr style="background:${rowBg};">
      <td style="padding:12px 14px;font-size:13px;color:#222;font-weight:500;border-bottom:1px solid #eee;">${item.Pattern || ''} &mdash; ${item.Color || ''}</td>
      <td style="padding:12px 14px;font-size:13px;color:#555;text-align:right;border-bottom:1px solid #eee;">${_fmtNum(rate)}</td>
      <td style="padding:12px 14px;font-size:13px;color:#555;text-align:right;border-bottom:1px solid #eee;">${Math.round(qty)}</td>
      <td style="padding:12px 14px;font-size:13px;color:#555;text-align:right;border-bottom:1px solid #eee;">${_fmtNum(subtotal)}</td>
      <td style="padding:12px 14px;font-size:13px;color:#555;text-align:right;border-bottom:1px solid #eee;">${_fmtNum(discountAmount)}</td>
      <td style="padding:12px 14px;font-size:13px;color:#555;text-align:right;border-bottom:1px solid #eee;">${_fmtNum(itemGst)}</td>
      <td style="padding:12px 14px;font-size:13px;color:#555;text-align:right;border-bottom:1px solid #eee;">${_fmtNum(itemTotal)}</td>
    </tr>`;
  }).join('');

  const grandTotal = totalAmount - totalDiscount + totalGst;

  // Avoid pincode duplication if address string already contains it
  const pin = (address.PinCode || '').toString().trim();
  const addrStr = (address.Address || '').toString().trim();
  const addrLine = pin && !addrStr.includes(pin) ? `${addrStr} &mdash; ${pin}` : addrStr;
  const cityState = [address.City, address.State].filter(Boolean).join(', ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Proforma Invoice</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;font-size:13px;color:#333;background:#fff;}
</style>
</head>
<body>

<!-- ── HEADER: logo on white, always visible ── -->
<div style="background:#ffffff;padding:24px 32px 16px;border-bottom:3px solid #111111;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="vertical-align:middle;">
        ${logoDataUri
          ? `<img src="${logoDataUri}" alt="VAYA" style="max-height:52px;">`
          : '<span style="font-size:30px;font-weight:700;letter-spacing:5px;color:#111;">VAYA</span>'
        }
      </td>
      <td style="text-align:right;vertical-align:middle;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#807A52;font-weight:700;margin-bottom:4px;">Date</div>
        <div style="font-size:14px;font-weight:600;color:#111;">${order.OrderDate || '—'}</div>
      </td>
    </tr>
  </table>
</div>

<!-- ── DOCUMENT TITLE BAR ── -->
<div style="background:#111111;padding:16px 32px;">
  <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:1px;">PI FOR FABRIC</div>
  <div style="font-size:12px;color:#c8bf9a;font-weight:600;margin-top:4px;letter-spacing:0.3px;">Ref &nbsp;# &nbsp;${order.PONumber || '—'}</div>
</div>

<!-- ── BILL TO ── -->
<div style="padding:24px 32px 20px;">
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:#807A52;font-weight:700;margin-bottom:10px;">Bill To</div>
  <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:4px;">${address.Name || ''}</div>
  <div style="font-size:13px;color:#555;line-height:21px;">
    ${addrLine ? `${addrLine}<br>` : ''}
    ${cityState}
  </div>
</div>

<!-- ── DIVIDER ── -->
<div style="margin:0 32px;border-top:1px solid #e8e8e4;"></div>

<!-- ── ITEMS TABLE ── -->
<div style="padding:20px 32px 0;">
  <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    <thead>
      <tr style="background:#111111;">
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:left;width:29%;">Item &amp; Description</th>
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:right;width:12%;">List Price</th>
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:right;width:7%;">Qty</th>
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:right;width:13%;">Subtotal</th>
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:right;width:12%;">Discount</th>
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:right;width:12%;">GST</th>
        <th style="padding:11px 14px;font-size:12px;font-weight:600;color:#fff;text-align:right;width:15%;">Net Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
</div>

<!-- ── TOTALS ── -->
<div style="padding:0 32px 32px;">
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:10px 14px 5px;font-size:13px;color:#555;text-align:right;padding-right:14px;" colspan="6">Sub Total</td>
      <td style="padding:10px 14px 5px;font-size:13px;font-weight:700;color:#111;text-align:right;width:15%;">${_fmtNum(totalAmount)}</td>
    </tr>
    <tr>
      <td style="padding:5px 14px;font-size:13px;color:#555;text-align:right;" colspan="6">Total Discount</td>
      <td style="padding:5px 14px;font-size:13px;color:#555;text-align:right;width:15%;">${_fmtNum(totalDiscount)}</td>
    </tr>
    <tr>
      <td style="padding:5px 14px 10px;font-size:13px;color:#555;text-align:right;" colspan="6">Total GST</td>
      <td style="padding:5px 14px 10px;font-size:13px;color:#555;text-align:right;width:15%;">${_fmtNum(totalGst)}</td>
    </tr>
    <tr style="background:#111111;">
      <td style="padding:14px 16px;font-size:14px;font-weight:700;color:#fff;text-align:right;" colspan="6">Grand Total</td>
      <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#fff;text-align:right;width:15%;">${_fmtNum(grandTotal)}</td>
    </tr>
  </table>
</div>

<!-- ── FOOTER ── -->
<div style="margin:0 32px 28px;border-top:1px solid #e8e8e4;padding-top:14px;font-size:11px;color:#aaa;text-align:center;letter-spacing:0.2px;">
  This is a computer-generated proforma invoice and does not require a signature.
</div>

</body>
</html>`;
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

  let logoDataUri = '';
  try {
    const logoRes = await axios.get('https://dealer.vayahome.com/public/assets/images/logo.png', { responseType: 'arraybuffer', timeout: 5000 });
    const mime = logoRes.headers['content-type'] || 'image/png';
    logoDataUri = `data:${mime};base64,${Buffer.from(logoRes.data).toString('base64')}`;
  } catch (_) { /* fall back to text fallback in HTML */ }

  const html = _buildOpenOrderHtml(order, address, logoDataUri);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    return await page.pdf({ format: 'A4' });
  } finally {
    await browser.close();
  }
}

module.exports = { getProducts, getOpenOrders, getReservedOrders, getMyOrders, placeOrder, cancelOrder, getReservedOrderByPo, getLiveProductsRaw, getOrderPdf, generateOpenOrderPdf, getPriceList, getPriceListJson, getUserDetails, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, getShippingModes, getStocks, getOrdersByUnc };
