const express = require('express');
const {
  getHotCategories,
  getFeaturedProducts,
  getFeaturedCategoriesRanked,
  getBestSelling,
  getDashboardStats,
  getSellerSalesStats,
} = require('../controllers/analyticsController');
const { authenticate, authenticateOptional, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/hot-categories', authenticateOptional, getHotCategories);
router.get('/featured-products', authenticateOptional, getFeaturedProducts);
router.get('/featured-categories', authenticateOptional, getFeaturedCategoriesRanked);
router.get('/best-selling', authenticateOptional, getBestSelling);
router.get('/dashboard', authenticate, requireAdmin, getDashboardStats);
router.get('/seller-sales', authenticate, requireAdmin, getSellerSalesStats);

module.exports = router;
