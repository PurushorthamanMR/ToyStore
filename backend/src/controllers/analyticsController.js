const pool = require('../config/db');

function applyProductVisibility(row, user) {
  const role = user?.role;
  const canSeeCode = role === 'Admin' || role === 'SuperAdmin';
  const canSeeCost = canSeeCode || role === 'Seller';
  const result = { ...row };
  if (!canSeeCode) delete result.product_code;
  if (!canSeeCost) delete result.purchase_price;
  if (role === 'Seller') {
    delete result.sale_price;
    delete result.discount_percent;
    delete result.discount_price;
  }
  return result;
}

async function queryTopProducts(days, limit, requireInStock = false) {
  const dateFilter = days ? 'AND o.created_at >= NOW() - INTERVAL ? DAY' : '';
  const stockFilter = requireInStock ? 'AND p.stock > 0' : '';
  const params = days ? [days, limit] : [limit];
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug, COALESCE(SUM(oi.quantity), 0) AS total_sold
     FROM products p
     JOIN order_items oi ON oi.product_id = p.id
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1 AND o.status = 'successful' ${dateFilter} ${stockFilter}
     GROUP BY p.id
     ORDER BY total_sold DESC
     LIMIT ?`,
    params
  );
  return rows;
}

async function getHotCategories(req, res) {
  try {
    const limit = Number(req.query.limit) || 10;
    const [rows] = await pool.query(
      `SELECT c.*, COALESCE(SUM(oi.quantity), 0) AS total_sold
       FROM categories c
       JOIN products p ON p.category_id = c.id
       JOIN order_items oi ON oi.product_id = p.id
       JOIN orders o ON o.id = oi.order_id
       WHERE c.is_active = 1 AND o.status = 'successful' AND o.created_at >= NOW() - INTERVAL 7 DAY
       GROUP BY c.id
       ORDER BY total_sold DESC
       LIMIT ?`,
      [limit]
    );
    if (rows.length > 0) return res.json(rows);

    const [fallback] = await pool.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC LIMIT ?',
      [limit]
    );
    res.json(fallback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch hot categories' });
  }
}

async function getFeaturedProducts(req, res) {
  try {
    const limit = Number(req.query.limit) || 3;
    const rows = await queryTopProducts(7, limit, true);
    if (rows.length > 0) return res.json(rows.map((r) => applyProductVisibility(r, req.user)));

    const [fallback] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.featured = 1 AND p.stock > 0
       ORDER BY p.created_at DESC LIMIT ?`,
      [limit]
    );
    res.json(fallback.map((r) => applyProductVisibility(r, req.user)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch featured products' });
  }
}

async function getFeaturedCategoriesRanked(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COALESCE(SUM(oi.quantity), 0) AS total_sold
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'successful'
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY total_sold DESC, c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch featured categories' });
  }
}

async function getBestSelling(req, res) {
  try {
    const limit = Number(req.query.limit) || 5;
    const rows = await queryTopProducts(null, limit, true);
    if (rows.length > 0) return res.json(rows.map((r) => applyProductVisibility(r, req.user)));

    const [fallback] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.stock > 0
       ORDER BY p.created_at DESC LIMIT ?`,
      [limit]
    );
    res.json(fallback.map((r) => applyProductVisibility(r, req.user)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch best selling products' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const [[{ revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status = 'successful'`
    );
    const [[{ orderCount }]] = await pool.query(`SELECT COUNT(*) AS orderCount FROM orders`);
    const [[{ productCount }]] = await pool.query(`SELECT COUNT(*) AS productCount FROM products WHERE is_active = 1`);
    const [[{ customerCount }]] = await pool.query(`SELECT COUNT(*) AS customerCount FROM customers`);

    const [revenueByDay] = await pool.query(
      `SELECT DATE(created_at) AS day, COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       WHERE status = 'successful' AND created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(created_at)
       ORDER BY day ASC`
    );

    const [statusBreakdown] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    const topProducts = await queryTopProducts(null, 10);

    const [topCategories] = await pool.query(
      `SELECT c.id, c.name, COALESCE(SUM(oi.quantity), 0) AS total_sold
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'successful'
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY total_sold DESC, c.name ASC
       LIMIT 5`
    );

    const [recentOrders] = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
              COALESCE(u.name, c.full_name) AS customer_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    res.json({
      revenue: Number(revenue),
      orderCount,
      productCount,
      customerCount,
      revenueByDay,
      statusBreakdown,
      topProducts: topProducts.map((r) => applyProductVisibility(r, req.user)),
      topCategories,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
}

async function getSellerSalesStats(req, res) {
  try {
    const [[{ totalCost }]] = await pool.query(
      `SELECT COALESCE(SUM(oi.quantity * p.purchase_price), 0) AS totalCost
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'successful'`
    );
    const [[{ unitsSold }]] = await pool.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) AS unitsSold
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = 'successful'`
    );
    const [[{ orderCount }]] = await pool.query(
      `SELECT COUNT(*) AS orderCount FROM orders WHERE status = 'successful'`
    );
    const [[{ productCount }]] = await pool.query(
      `SELECT COUNT(*) AS productCount FROM products WHERE is_active = 1`
    );

    const [costByDay] = await pool.query(
      `SELECT DATE(o.created_at) AS day, COALESCE(SUM(oi.quantity * p.purchase_price), 0) AS cost
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status = 'successful' AND o.created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(o.created_at)
       ORDER BY day ASC`
    );

    const [topProducts] = await pool.query(
      `SELECT p.id, p.name, p.product_code, p.purchase_price, c.name AS category_name,
              COALESCE(SUM(oi.quantity), 0) AS total_sold,
              COALESCE(SUM(oi.quantity * p.purchase_price), 0) AS total_cost
       FROM products p
       JOIN order_items oi ON oi.product_id = p.id
       JOIN orders o ON o.id = oi.order_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND o.status = 'successful'
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 10`
    );

    const [statusBreakdown] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    res.json({
      totalCost: Number(totalCost),
      unitsSold,
      orderCount,
      productCount,
      costByDay,
      topProducts,
      statusBreakdown,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch seller sales analysis' });
  }
}

module.exports = {
  getHotCategories,
  getFeaturedProducts,
  getFeaturedCategoriesRanked,
  getBestSelling,
  getDashboardStats,
  getSellerSalesStats,
};
