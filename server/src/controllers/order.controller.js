const erpService = require('../services/erp.service');
const prisma = require('../config/database');

exports.getMyOrders = async (req, res) => {
  const data = await erpService.getMyOrders({ unc: req.user.unc });
  res.json({ success: true, data });
};

exports.getOpenOrders = async (req, res) => {
  const data = await erpService.getOpenOrders({ unc: req.user.unc });
  res.json({ success: true, data });
};

exports.getReservedOrders = async (req, res) => {
  const data = await erpService.getReservedOrders({ unc: req.user.unc });
  res.json({ success: true, data });
};

exports.downloadOrder = async (req, res) => {
  const pdfBuffer = await erpService.getOrderPdf(req.params.po);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=order-${req.params.po}.pdf`);
  res.send(pdfBuffer);
};

exports.cancelOrder = async (req, res) => {
  const result = await erpService.cancelOrder(req.user.unc, req.params.id);
  res.json(result);
};

exports.convertReservedToOrder = async (req, res) => {
  const po = req.params[0];
  if (!po) return res.status(400).json({ success: false, message: 'PO number is required' });

  const user = req.user;

  // 1. Fetch the reserved order from ERP
  const order = await erpService.getReservedOrderByPo(user.unc, po);

  // 2. Fetch live products for pricing (Roll Price, Cut Price, GST)
  const liveProducts = await erpService.getLiveProductsRaw(user.unc);
  const productIndex = {};
  for (const p of liveProducts) {
    const key = `${p.Pattern}||${p.Color}`;
    if (!productIndex[key]) productIndex[key] = p;
  }

  // 3. Clear user's existing cart
  await prisma.cartItem.deleteMany({ where: { userId: user.id } });

  // 4. Add reserved order items to cart with live pricing
  for (const item of order.OrderItems) {
    const key = `${item.Pattern}||${item.Color}`;
    const liveProduct = productIndex[key];
    const quantity       = parseFloat(item.OrderdLength || item.OrderedLength) || 0;
    const totalAvailable = liveProduct ? (parseFloat(liveProduct.TotalLength) || 0) : null;
    await prisma.cartItem.create({
      data: {
        userId:         user.id,
        productId:      liveProduct?.PcSINo || key,
        productName:    `${item.Pattern} - ${item.Color}`,
        pattern:        item.Pattern || '',
        color:          item.Color || '',
        price:          parseFloat(item.Rate) || 0,
        rollPrice:      parseFloat(liveProduct?.['Roll Price']) || parseFloat(item.Rate) || 0,
        cutPrice:       parseFloat(liveProduct?.['Cut Price'])  || parseFloat(item.Rate) || 0,
        gstPercent:     parseFloat(liveProduct?.['GST Perc'])   || 5,
        quantity,
        totalAvailable,
        noStock:        totalAvailable !== null ? quantity > totalAvailable : false,
      },
    });
  }

  // 5. Return metadata so frontend can pre-fill the cart form
  res.json({
    success: true,
    data: {
      shippingAddressId: String(order.ShippingAddressID || ''),
      billingAddressId:  String(order.BillingAddressID  || ''),
      poNumber:          order.PONumber   || '',
      shippingMode:      order.ShippingMode || '',
      refPoNumber:       order.PONumber   || '',
    },
  });
};

exports.downloadOpenOrderPdf = async (req, res) => {
  const { po } = req.query;
  if (!po) return res.status(400).json({ error: 'po query param is required' });
  const pdfBuffer = await erpService.generateOpenOrderPdf({ unc: req.user.unc, poNumber: po });
  const safeName = po.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
  res.send(pdfBuffer);
};
