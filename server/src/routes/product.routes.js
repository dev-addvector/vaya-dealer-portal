const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/product.controller');

router.post('/load', auth, c.loadProducts);
router.get('/load', auth, (req, res) => {
  req.body = req.query;
  return c.loadProducts(req, res);
});
router.get('/cart', auth, c.getCart);
router.post('/cart/add', auth, c.addToCart);
router.put('/cart/edit', auth, c.editCartItem);
router.delete('/cart/:id', auth, c.deleteCartItem);
router.get('/shipping-modes', auth, c.getShippingModes);
router.get('/filters', auth, c.getProductFilters);
router.post('/place-order', auth, c.placeOrder);

module.exports = router;
