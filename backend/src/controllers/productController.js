const pool = require('../config/db');
const { slugify } = require('./categoryController');

const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

function canManage(user) {
  return user && ['Admin', 'SuperAdmin'].includes(user.role);
}

function applyFieldVisibility(row, user) {
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

async function listProducts(req, res) {
  try {
    const { category, search, featured, limit, offset, active, lowStock } = req.query;
    const where = [];
    const values = [];
    const isStaff = req.user?.type === 'staff';

    let isActive = 1;
    if (canManage(req.user) && active !== undefined) {
      isActive = active === '0' || active === 'false' ? 0 : 1;
    }
    where.push('p.is_active = ?');
    values.push(isActive);

    if (category) {
      where.push('c.slug = ?');
      values.push(category);
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.product_code LIKE ? OR c.name LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (featured === 'true') {
      where.push('p.featured = 1');
    }

    if (canManage(req.user) && lowStock === 'true') {
      where.push('p.stock < 10');
    } else if (!isStaff) {
      // Out-of-stock products are hidden from the public storefront.
      where.push('p.stock > 0');
    }

    let sql = BASE_SELECT;
    if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY p.created_at DESC';
    if (limit) {
      sql += ' LIMIT ?';
      values.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        values.push(Number(offset));
      }
    }

    const [rows] = await pool.query(sql, values);
    res.json(rows.map((row) => applyFieldVisibility(row, req.user)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

async function getProduct(req, res) {
  try {
    const { slug } = req.params;
    const sql = canManage(req.user)
      ? `${BASE_SELECT} WHERE p.slug = ?`
      : `${BASE_SELECT} WHERE p.slug = ? AND p.is_active = 1`;
    const [rows] = await pool.query(sql, [slug]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(applyFieldVisibility(rows[0], req.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
}

function validateDiscountPercent(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0 && n <= 100;
}

async function createProduct(req, res) {
  try {
    const {
      name, description, product_code, purchase_price, sale_price, discount_percent,
      stock, image, category_id, featured
    } = req.body;
    if (!name || sale_price === undefined) {
      return res.status(400).json({ message: 'Name and sale price are required' });
    }
    const discount = discount_percent === undefined || discount_percent === '' ? 0 : discount_percent;
    if (!validateDiscountPercent(discount)) {
      return res.status(400).json({ message: 'Discount percent must be between 0 and 100' });
    }
    const slug = slugify(name);
    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, slug, product_code, description, purchase_price, sale_price, discount_percent, stock, image, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id || null,
        name,
        slug,
        product_code || null,
        description || null,
        purchase_price || 0,
        sale_price,
        discount,
        stock || 0,
        image || null,
        featured ? 1 : 0
      ]
    );
    res.status(201).json({ id: result.insertId, slug });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Product code already in use' });
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const {
      name, description, product_code, purchase_price, sale_price, discount_percent,
      stock, image, category_id, featured
    } = req.body;
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (product_code !== undefined) { fields.push('product_code = ?'); values.push(product_code || null); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (purchase_price !== undefined) { fields.push('purchase_price = ?'); values.push(purchase_price || 0); }
    if (sale_price !== undefined) { fields.push('sale_price = ?'); values.push(sale_price); }
    if (discount_percent !== undefined) {
      const discount = discount_percent === '' ? 0 : discount_percent;
      if (!validateDiscountPercent(discount)) {
        return res.status(400).json({ message: 'Discount percent must be between 0 and 100' });
      }
      fields.push('discount_percent = ?');
      values.push(discount);
    }
    if (stock !== undefined) { fields.push('stock = ?'); values.push(stock); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id || null); }
    if (featured !== undefined) { fields.push('featured = ?'); values.push(featured ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });
    values.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Product code already in use' });
    }
    res.status(500).json({ message: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to deactivate product' });
  }
}

async function restoreProduct(req, res) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE products SET is_active = 1 WHERE id = ?', [id]);
    res.json({ message: 'Product restored' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to restore product' });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, restoreProduct };
