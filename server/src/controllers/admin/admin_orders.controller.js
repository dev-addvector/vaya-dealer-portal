const prisma = require('../../config/database');
const erpService = require('../../services/erp.service');

exports.getFilterOptionsForOrder = async (req, res) => {
  const unc = decodeURIComponent(req.params.unc);
  try {
    const raw = await erpService.getLiveProductsRaw(unc);
    const patternColorsMap = {};
    const colorPatternsMap = {};
    for (const item of raw) {
      const pattern = item.Pattern?.trim();
      const color = item.Color?.trim();
      if (!pattern || !color) continue;
      if (!patternColorsMap[pattern]) patternColorsMap[pattern] = new Set();
      patternColorsMap[pattern].add(color);
      if (!colorPatternsMap[color]) colorPatternsMap[color] = new Set();
      colorPatternsMap[color].add(pattern);
    }
    res.json({
      success: true,
      data: {
        patterns: Object.keys(patternColorsMap).sort(),
        colors: Object.keys(colorPatternsMap).sort(),
        patternColors: Object.fromEntries(Object.entries(patternColorsMap).map(([k, v]) => [k, [...v].sort()])),
        colorPatterns: Object.fromEntries(Object.entries(colorPatternsMap).map(([k, v]) => [k, [...v].sort()])),
      },
    });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to load filter options from ERP', error: err.message });
  }
};

exports.viewOrders = async (req, res) => {
  const unc = decodeURIComponent(req.params.unc);
  if (!unc) return res.status(400).json({ success: false, message: 'UNC is required' });
  try {
    const orders = await erpService.getOrdersByUnc(unc, 'All');
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to fetch orders from ERP', error: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: 'user', unc: { not: null } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, unc: true, zone: true, cutDiscount: true, rollDiscount: true },
  });
  res.json({ success: true, data: customers });
};

exports.getProductsForOrder = async (req, res) => {
  const unc = decodeURIComponent(req.params.unc);
  const { pattern, color, page = 1, perPage = 50 } = req.query;
  try {
    const result = await erpService.getProducts({ unc, pattern, color, page: Number(page), perPage: Number(perPage) });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to load products from ERP', error: err.message });
  }
};

exports.getAddressesForOrder = async (req, res) => {
  const unc = decodeURIComponent(req.params.unc);
  try {
    const addresses = await erpService.getAddresses(unc);
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to load addresses', error: err.message });
  }
};

exports.getShippingModesForOrder = async (req, res) => {
  const unc = decodeURIComponent(req.params.unc);
  try {
    const modes = await erpService.getShippingModes(unc);
    res.json({ success: true, data: modes });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to load shipping modes', error: err.message });
  }
};

exports.placeAdminOrder = async (req, res) => {
  const { unc, cartItems, shippingAddressId, billingAddressId, shipmentMode, poNumber, orderDate, orderType, cutDiscount = 0, rollDiscount = 0 } = req.body;

  if (!unc) return res.status(400).json({ success: false, message: 'UNC is required' });
  if (!cartItems || !cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

  const settings = await prisma.setting.findFirst();
  const globalGst = settings?.gst || 5;

  const orderItems = cartItems.map((item) => {
    const qty = Number(item.quantity) || 0;
    const isRoll = qty >= 50;
    const rate = isRoll ? (item.rollPrice || item.price || 0) : (item.cutPrice || item.price || 0);
    const basePrice = rate * qty;
    const discountPct = isRoll ? Number(rollDiscount) : Number(cutDiscount);
    const itemDiscount = (basePrice * discountPct) / 100;
    const taxable = basePrice - itemDiscount;
    const gstPct = item.gstPercent || globalGst;
    const gstAmount = (taxable * gstPct) / 100;

    return {
      Pattern: item.pattern || '',
      Color: item.color || '',
      OrderedLength: String(qty),
      TotalCost: taxable.toFixed(2),
      TaxAmount: gstAmount.toFixed(2),
      DiscountType: 'V',
      DiscountVal: itemDiscount.toFixed(2),
      QuantityRange: isRoll ? 'ROll' : 'CUT',
      Rate: String(rate),
      Comments: item.remark || '',
    };
  });

  const [y, m, d] = orderDate
    ? orderDate.split('-')
    : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).split('-');

  const effectiveShipping = String(shippingAddressId || billingAddressId || '');
  const effectiveBilling = String(billingAddressId || shippingAddressId || '');

  const erpPayload = {
    UCN: unc,
    OrderItems: orderItems,
    ShippingAddressID: effectiveShipping,
    BillingAddressID: effectiveBilling,
    PONumber: poNumber || '',
    ShippingMode: orderType === 'Reserved' ? 'TBD' : (shipmentMode || ''),
    OrderType: orderType || 'Ordered',
    ReserveDate: orderType === 'Reserved' ? `${d}-${m}-${y}` : '',
    DeliveryDate: orderType !== 'Reserved' ? `${m}-${d}-${y}` : '',
    RefPONumber: '',
  };

  console.log('[placeAdminOrder] ERP payload:', JSON.stringify(erpPayload, null, 2));
  try {
    const result = await erpService.placeOrder(erpPayload);
    console.log('[placeAdminOrder] ERP result:', JSON.stringify(result, null, 2));
    const isSuccess = result?.status === true || result?.status === 'TRUE' ||
      result?.return_code === 200 || result?.return_code === '200' ||
      result?.success === true;
    if (isSuccess) return res.json({ success: true, message: 'Order placed successfully' });
    const errMsg = result?.message || result?.return_message || 'Failed to place order';
    return res.status(400).json({ success: false, message: errMsg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || 'Server error placing order' });
  }
};
