const router = require('express').Router();
const c = require('../../controllers/admin/admin_orders.controller');
const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

const orderCreators = requireRoles(ROLES.ADMIN, ROLES.SUB_ADMIN, ROLES.ZONE_ADMIN);
const superOrSub = requireRoles(ROLES.ADMIN, ROLES.SUB_ADMIN);

// Specific routes must come before /:unc param route
router.get('/customers', orderCreators, c.getCustomers);
router.get('/products/:unc', orderCreators, c.getProductsForOrder);
router.get('/addresses/:unc', orderCreators, c.getAddressesForOrder);
router.get('/shipping/:unc', orderCreators, c.getShippingModesForOrder);
router.post('/place', orderCreators, c.placeAdminOrder);

// View orders by UNC
router.get('/:unc', superOrSub, c.viewOrders);

module.exports = router;
