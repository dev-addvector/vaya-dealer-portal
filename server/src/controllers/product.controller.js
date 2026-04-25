const bcrypt = require('bcryptjs');
const erpService = require('../services/erp.service');
const prisma = require('../config/database');
const { detectDevice, detectOS } = require('../utils/helpers');
const { cacheGet, cacheSet } = require('../config/redis');

exports.loadProducts = async (req, res) => {
  const { pattern, color, page, perPage, search } = req.body;
  const start = Date.now();
  const data = await erpService.getProducts({
    pattern, color, page, perPage,
    unc: req.user.unc,
    zone: req.user.zone,
  });
  const elapsed = (Date.now() - start) / 1000;
  prisma.searchReport.create({
    data: {
      search_string: search || null,
      pattern: pattern || null,
      color: color || null,
      elpsed_time: String(elapsed),
      row_count: data?.total || 0,
      device_type: detectDevice(req.headers['user-agent']),
      os_type: detectOS(req.headers['user-agent']),
      user_agent: req.headers['user-agent'],
    },
  }).catch(() => {});
  res.json({ success: true, data });
};

exports.getCart = async (req, res) => {
  const items = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
  const user = req.user;
  const settings = await prisma.setting.findFirst();
  res.json({
    success: true,
    items,
    userDiscounts: {
      cutDiscount: parseFloat(user.cutDiscount || 0),
      rollDiscount: parseFloat(user.rollDiscount || 0),
    },
    gst: settings?.gst || 5,
    receivingOrderDays: settings?.receiving_order_days || 30,
  });
};

exports.addToCart = async (req, res) => {
  const { productId, productName, pattern, color, price, rollPrice, cutPrice, gstPercent, quantity, unit, remark, noStock, totalAvailable } = req.body;
  const existing = await prisma.cartItem.findFirst({ where: { userId: req.user.id, productId } });
  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: quantity || existing.quantity, noStock: noStock || false, totalAvailable: totalAvailable ?? existing.totalAvailable },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId: req.user.id,
        productId,
        productName,
        pattern,
        color,
        price,
        rollPrice: rollPrice || price,
        cutPrice: cutPrice || price,
        gstPercent: gstPercent || null,
        quantity: quantity || 1,
        unit,
        remark,
        noStock: noStock || false,
        totalAvailable: totalAvailable ?? null,
      },
    });
  }
  res.json({ success: true, message: 'Added to cart' });
};

exports.editCartItem = async (req, res) => {
  const { id, quantity, remark, noStock, totalAvailable } = req.body;
  const updateData = {};
  if (quantity !== undefined) updateData.quantity = quantity;
  if (remark !== undefined) updateData.remark = remark;
  if (noStock !== undefined) updateData.noStock = noStock;
  if (totalAvailable !== undefined) updateData.totalAvailable = totalAvailable;
  await prisma.cartItem.updateMany({
    where: { id, userId: req.user.id },
    data: updateData,
  });
  res.json({ success: true, message: 'Cart updated' });
};

exports.deleteCartItem = async (req, res) => {
  await prisma.cartItem.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });
  res.json({ success: true, message: 'Item removed' });
};

exports.getShippingModes = async (req, res) => {
  try {
    const modes = await erpService.getShippingModes(req.user.unc);
    res.json({ success: true, modes });
  } catch {
    res.json({ success: true, modes: [] });
  }
};

const FILTERS_TTL = 30 * 60; // 30 minutes

exports.getProductFilters = async (req, res) => {
  try {
    const cacheKey = `erp:filters:${req.user.unc}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Reuse the cached raw rolls (shares erp:raw:{unc}: with getLiveProductsRaw)
    const raw = await erpService.getLiveProductsRaw(req.user.unc);

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

    const result = {
      patterns: Object.keys(patternColorsMap).sort(),
      colors: Object.keys(colorPatternsMap).sort(),
      patternColors: Object.fromEntries(
        Object.entries(patternColorsMap).map(([k, v]) => [k, [...v].sort()])
      ),
      colorPatterns: Object.fromEntries(
        Object.entries(colorPatternsMap).map(([k, v]) => [k, [...v].sort()])
      ),
    };

    await cacheSet(cacheKey, result, FILTERS_TTL);

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting product filters:', error);
    res.json({
      success: true,
      data: { patterns: [], colors: [], patternColors: {}, colorPatterns: {} },
    });
  }
};

// Keep the old endpoint for backward compatibility but mark as deprecated
exports.getPatternColorRelations = async (req, res) => {
  console.warn('getPatternColorRelations is deprecated, use getProductFilters instead');
  return exports.getProductFilters(req, res);
};

exports.placeOrder = async (req, res) => {
  const { shippingAddressId, billingAddressId, shipmentMode, poNumber, orderDate, orderType, authPassword, refPoNumber } = req.body;
  const user = req.user;

  if (!user.authorizationPassword) {
    return res.status(400).json({ success: false, message: 'Authorization password not set for this account' });
  }
  const passwordValid = await bcrypt.compare(authPassword || '', user.authorizationPassword);
  if (!passwordValid) {
    return res.status(400).json({ success: false, message: 'Invalid authorization password' });
  }

  const cartItems = await prisma.cartItem.findMany({ where: { userId: user.id } });
  if (!cartItems.length) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const cutDiscount = parseFloat(user.cutDiscount || 0);
  const rollDiscount = parseFloat(user.rollDiscount || 0);
  const settings = await prisma.setting.findFirst();
  const globalGst = settings?.gst || 5;

  const orderItems = cartItems.map((item) => {
    const orderedLength = item.quantity || 0;
    const isRoll = orderedLength >= 50;
    const rate = isRoll ? (item.rollPrice || item.price || 0) : (item.cutPrice || item.price || 0);
    const basePrice = rate * orderedLength;
    const discountPct = isRoll ? rollDiscount : cutDiscount;
    const itemDiscount = (basePrice * discountPct) / 100;
    const taxable = basePrice - itemDiscount;
    const gstPct = item.gstPercent || globalGst;
    const gstAmount = (taxable * gstPct) / 100;

    return {
      Pattern: item.pattern || '',
      Color: item.color || '',
      OrderedLength: String(orderedLength),
      TotalCost: taxable.toFixed(2),
      TaxAmount: gstAmount.toFixed(2),
      DiscountType: 'V',
      DiscountVal: itemDiscount.toFixed(2),
      QuantityRange: isRoll ? 'ROll' : 'CUT',
      Rate: String(rate),
      Comments: item.remark || '',
    };
  });

  const effectiveShipping = String(shippingAddressId || billingAddressId || '');
  const effectiveBilling = String(billingAddressId || shippingAddressId || '');

  const [y, m, d] = orderDate
    ? orderDate.split('-')
    : new Date().toISOString().split('T')[0].split('-');

  const erpPayload = {
    UCN: user.unc,
    OrderItems: orderItems,
    ShippingAddressID: effectiveShipping,
    BillingAddressID: effectiveBilling,
    PONumber: poNumber || '',
    ShippingMode: orderType === 'Reserved' ? 'TBD' : (shipmentMode || ''),
    OrderType: orderType || 'Ordered',
    ReserveDate: orderType === 'Reserved' ? `${d}-${m}-${y}` : '',
    DeliveryDate: orderType !== 'Reserved' ? `${m}-${d}-${y}` : '',
    RefPONumber: refPoNumber || '',
  };

  console.log('[placeOrder] ERP payload:', JSON.stringify(erpPayload, null, 2));
  try {
    const result = await erpService.placeOrder(erpPayload);
    console.log('[placeOrder] ERP result:', JSON.stringify(result, null, 2));
    const isSuccess = result?.status === true || result?.status === 'TRUE' ||
      result?.return_code === 200 || result?.return_code === '200' ||
      result?.success === true;
    if (isSuccess) {
      await prisma.cartItem.deleteMany({ where: { userId: user.id } });
      return res.json({ success: true, message: 'Order placed successfully' });
    }
    const errMsg = result?.message || result?.return_message || 'Failed to place order';
    return res.status(400).json({ success: false, message: errMsg });
  } catch (err) {
    console.error('[placeOrder] Error:', err?.message, err?.response?.data);
    return res.status(500).json({ success: false, message: err?.message || 'Server error placing order' });
  }
};
