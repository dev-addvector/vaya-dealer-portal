const router = require('express').Router();
const c = require('../../controllers/admin/admin_orders.controller');

// Specific routes must come before /:unc param route
router.get('/customers', c.getCustomers);
router.get('/products/:unc', c.getProductsForOrder);
router.get('/addresses/:unc', c.getAddressesForOrder);
router.get('/shipping/:unc', c.getShippingModesForOrder);
router.post('/place', c.placeAdminOrder);

// View orders by UNC (existing)
router.get('/:unc', c.viewOrders);

module.exports = router;
