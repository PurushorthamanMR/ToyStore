const express = require('express');
const {
  placeOrder,
  listMyOrders,
  listAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, placeOrder);
router.get('/mine', authenticate, listMyOrders);
router.get('/', authenticate, requireAdmin, listAllOrders);
router.put('/:id/status', authenticate, requireAdmin, updateOrderStatus);

module.exports = router;
