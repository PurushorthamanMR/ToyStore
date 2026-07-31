const express = require('express');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct
} = require('../controllers/productController');
const { authenticate, authenticateOptional, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateOptional, listProducts);
router.get('/:slug', authenticateOptional, getProduct);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
router.put('/:id/restore', authenticate, requireAdmin, restoreProduct);

module.exports = router;
